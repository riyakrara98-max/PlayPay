'use client';

import React from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <Card variant="elevated" className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
        <CardDescription>Join PlayPay to start completing tasks and earning rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
