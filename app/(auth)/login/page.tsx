'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Card variant="elevated" className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your PlayPay account to manage tasks and rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
