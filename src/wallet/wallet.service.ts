import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
  ) {}

  async initiateDeposit(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User wallet not found');
    }

    // Generate unique reference
    const reference = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: user.wallet.id,
        type: 'DEPOSIT',
        amount: new Decimal(amount),
        status: 'PENDING',
        reference,
        description: 'Wallet deposit via Paystack',
      },
    });

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction(
      user.email,
      amount,
      reference,
    );

    // Update transaction with Paystack details
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paystackRef: paystackResponse.reference,
        authorizationUrl: paystackResponse.authorization_url,
      },
    });

    return {
      reference,
      authorization_url: paystackResponse.authorization_url,
    };
  }

  async handleWebhook(event: any) {
    const { event: eventType, data } = event;

    if (eventType !== 'charge.success') {
      return { status: true };
    }

    const reference = data.reference;
    const amount = data.amount / 100; // Convert from kobo to naira

    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if already processed (idempotency)
    if (transaction.status === 'SUCCESS') {
      return { status: true };
    }

    // Update transaction and wallet balance in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' },
      });

      // Credit wallet
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            increment: new Decimal(amount),
          },
        },
      });
    });

    return { status: true };
  }

  async getDepositStatus(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference,
      status: transaction.status.toLowerCase(),
      amount: Number(transaction.amount),
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: Number(wallet.balance),
    };
  }

  async transfer(senderId: string, walletNumber: string, amount: number) {
    // Get sender wallet
    const senderWallet = await this.prisma.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet) {
      throw new NotFoundException('Sender wallet not found');
    }

    // Check balance
    if (Number(senderWallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Get recipient wallet
    const recipientWallet = await this.prisma.wallet.findUnique({
      where: { walletNumber },
      include: { user: true },
    });

    if (!recipientWallet) {
      throw new NotFoundException('Recipient wallet not found');
    }

    // Prevent self-transfer
    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to your own wallet');
    }

    // Perform transfer in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: new Decimal(amount),
          },
        },
      });

      // Add to recipient
      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: {
            increment: new Decimal(amount),
          },
        },
      });

      // Create sender transaction record
      await tx.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: 'TRANSFER_OUT',
          amount: new Decimal(amount),
          status: 'SUCCESS',
          senderId,
          receiverId: recipientWallet.userId,
          recipientWalletNumber: walletNumber,
          description: `Transfer to ${walletNumber}`,
        },
      });

      // Create recipient transaction record
      await tx.transaction.create({
        data: {
          walletId: recipientWallet.id,
          type: 'TRANSFER_IN',
          amount: new Decimal(amount),
          status: 'SUCCESS',
          senderId,
          receiverId: recipientWallet.userId,
          description: `Transfer from ${senderWallet.walletNumber}`,
        },
      });
    });

    return {
      status: 'success',
      message: 'Transfer completed',
    };
  }

  async getTransactionHistory(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    return transactions.map(tx => ({
      type: tx.type.toLowerCase(),
      amount: Number(tx.amount),
      status: tx.status.toLowerCase(),
      description: tx.description,
      created_at: tx.createdAt,
    }));
  }
}