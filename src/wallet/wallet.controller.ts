import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { FlexibleAuthGuard } from './guards/flexible-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private paystackService: PaystackService,
  ) {}

  @Post('deposit')
  @UseGuards(FlexibleAuthGuard)
  async deposit(@Req() req, @Body() dto: DepositDto) {
    const userId = req.user.id;
    return this.walletService.initiateDeposit(userId, dto.amount);
  }

  @Post('paystack/webhook')
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    console.log('🔔 Webhook received from Paystack');
    
    // Verify webhook signature
    const rawBody = JSON.stringify(body);
    
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    const isValid = this.paystackService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    console.log('✅ Webhook signature verified');
    return this.walletService.handleWebhook(body);
  }

  @Get('deposit/:reference/status')
  @UseGuards(FlexibleAuthGuard)
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(FlexibleAuthGuard)
  async getBalance(@Req() req) {
    const userId = req.user.id;
    return this.walletService.getBalance(userId);
  }

  @Post('transfer')
  @UseGuards(FlexibleAuthGuard)
  async transfer(@Req() req, @Body() dto: TransferDto) {
    const userId = req.user.id;
    return this.walletService.transfer(userId, dto.wallet_number, dto.amount);
  }

  @Get('transactions')
  @UseGuards(FlexibleAuthGuard)
  async getTransactions(@Req() req) {
    const userId = req.user.id;
    return this.walletService.getTransactionHistory(userId);
  }
}