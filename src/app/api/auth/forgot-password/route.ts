import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { Resend } from 'resend';

// Check if required environment variables are available
if (!process.env.RESEND_API_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
  console.error('Missing required environment variables: RESEND_API_KEY or NEXT_PUBLIC_APP_URL');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// For development/testing, use this email
const TEST_EMAIL = 'goodforgood.social@gmail.com';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Log the email being processed
    console.log('Processing password reset request for:', email);

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email },
    });

    // Log if member was found
    console.log('Member found:', member ? 'Yes' : 'No');

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update member with reset token (even if member doesn't exist, to prevent email enumeration)
    if (member) {
      await prisma.member.update({
        where: { email },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      // Send password reset email
      try {
        console.log('Attempting to send email with Resend...');
        
        if (!process.env.NEXT_PUBLIC_APP_URL) {
          throw new Error('NEXT_PUBLIC_APP_URL is not configured');
        }

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
        
        // In development, only send to test email
        const toEmail = IS_DEVELOPMENT ? TEST_EMAIL : email;
        
        const result = await resend.emails.send({
          from: 'Good for Good Trust <noreply@resend.dev>',
          to: toEmail,
          subject: 'Reset Your Password - Good for Good Trust',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Reset Your Password</h2>
              <p>Hello,</p>
              ${IS_DEVELOPMENT && email !== TEST_EMAIL ? 
                `<p><strong>Note: This is a development environment. The reset link has been sent to ${TEST_EMAIL} instead of ${email}</strong></p>` : 
                ''
              }
              <p>We received a request to reset your password for your Good for Good Trust account. If you didn't make this request, you can safely ignore this email.</p>
              <p>To reset your password, click the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
              <p>This link will expire in 24 hours for security reasons.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #666; font-size: 12px;">
                If you didn't request a password reset, no action is required. Your password will remain unchanged.
              </p>
            </div>
          `,
        });

        console.log('Email sent successfully. Result:', result);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return NextResponse.json(
          { error: IS_DEVELOPMENT ? 
            'Development environment: Reset link would be sent to your email in production.' : 
            'Failed to send password reset email. Please try again later.' },
          { status: 200 } // Still return 200 to prevent email enumeration
        );
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: IS_DEVELOPMENT ?
        'Development environment: If an account exists, the reset link will be sent to the test email address.' :
        'If an account exists with this email, you will receive password reset instructions.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 