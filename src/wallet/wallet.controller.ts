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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { FlexibleAuthGuard } from './guards/flexible-auth.guard';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private paystackService: PaystackService,
  ) {}

  @Post('deposit')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ summary: 'Initiate wallet deposit via Paystack' })
  @ApiBody({ type: DepositDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Deposit initiated successfully',
    schema: {
      example: {
        reference: 'DEP_1733780123_abc456',
        authorization_url: 'https://checkout.paystack.com/xyz123'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deposit(@Req() req, @Body() dto: DepositDto) {
    const userId = req.user.id;
    return this.walletService.initiateDeposit(userId, dto.amount);
  }

  @Post('paystack/webhook')
  @ApiOperation({ summary: 'Paystack webhook endpoint (called by Paystack)' })
  @ApiHeader({ name: 'x-paystack-signature', description: 'Paystack webhook signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody = JSON.stringify(body);
    
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    const isValid = this.paystackService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return this.walletService.handleWebhook(body);
  }

  @Get('deposit/:reference/status')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ summary: 'Check deposit transaction status' })
  @ApiParam({ name: 'reference', description: 'Transaction reference' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction status retrieved',
    schema: {
      example: {
        reference: 'DEP_1733780123_abc456',
        status: 'success',
        amount: 5000
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ 
    status: 200, 
    description: 'Balance retrieved successfully',
    schema: {
      example: {
        balance: 15000
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Req() req) {
    const userId = req.user.id;
    return this.walletService.getBalance(userId);
  }

  @Post('transfer')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiBody({ type: TransferDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Transfer completed successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Transfer completed'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid wallet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async transfer(@Req() req, @Body() dto: TransferDto) {
    const userId = req.user.id;
    return this.walletService.transfer(userId, dto.wallet_number, dto.amount);
  }

  @Get('transactions')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction history retrieved',
    schema: {
      example: [
        {
          type: 'deposit',
          amount: 5000,
          status: 'success',
          description: 'Wallet deposit via Paystack',
          created_at: '2025-12-10T01:35:00Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(@Req() req) {
    const userId = req.user.id;
    return this.walletService.getTransactionHistory(userId);
  }
}