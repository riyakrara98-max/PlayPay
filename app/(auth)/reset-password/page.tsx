'use client';

import React from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <Card variant="elevated" className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl sm:text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your account email to receive a password recovery link</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
