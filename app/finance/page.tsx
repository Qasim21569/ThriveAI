'use client';

import React from 'react';
import ChatLayout from '../../components/ChatLayout';

const FinancePage = () => {
  const financeData = {
    title: '💡 Smart Finances',
    icon: '💡',
    description: '📊 Take control of your money with expert tips on budgeting, saving, and investing. Build a secure and smarter financial future with confidence.',
    longDescription: 'Sup! I\'m your money bestie - here to help you get your finances in check without the boring jargon or judgment. Whether you\'re drowning in debt, trying to save for something awesome, or just want to stop living paycheck to paycheck, I\'ve got the real-world advice you need!',
    benefits: [
      'Budgeting that doesn\'t make you want to cry',
      'Debt payoff plans that actually work',
      'Investing for people who aren\'t Wall Street bros',
      'Saving hacks when you think you\'re too broke to save',
      'Credit score glow-ups without the stress',
      'Money mindset shifts to stop self-sabotage',
      'Real talk about spending that sparks joy'
    ],
    suggestedPrompts: [
      'I\'m broke AF, how do I budget?',
      'How do I stop impulse shopping online?',
      'Investing for absolute beginners',
      'Should I buy crypto or nah?',
      'I need to save for a vacation ASAP',
      'Help me not panic about my student loans'
    ],
    accentColor: '#ffc107' // a gold/amber shade
  };

  return <ChatLayout {...financeData} />;
};

export default FinancePage; 