import React from 'react';
import { Clock, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

interface PayoutScheduleInfoProps {
  title?: string;
  variant?: 'card' | 'banner' | 'compact';
  userRole?: 'tutor' | 'institution';
}

const PayoutScheduleInfo: React.FC<PayoutScheduleInfoProps> = ({
  title = 'Payout Schedule',
  variant = 'card',
  userRole = 'tutor'
}) => {
  const timelineSteps = [
    {
      label: 'Payment Verified',
      duration: 'Immediate',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'from-yellow-500 to-blue-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      label: 'Marked for Settlement',
      duration: '0-24 hours',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Processing',
      duration: '24-48 hours',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Funds Received',
      duration: '48-72 hours',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    }
  ];

  const bannerContent = (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">Payout Settlement Timeline</h3>
          <p className="text-gray-600 text-sm mt-1">
            {userRole === 'tutor' 
              ? 'Your earnings will be deposited within 24-72 hours after a successful student payment. Here\'s what to expect:'
              : 'Your course revenue will be deposited within 24-72 hours after a successful student payment. Here\'s what to expect:'}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 font-bold min-w-fit mt-0.5">1. Immediate:</span>
              <span className="text-gray-600">Payment verified and confirmed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold min-w-fit mt-0.5">2. 0-24h:</span>
              <span className="text-gray-600">Payment marked for settlement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold min-w-fit mt-0.5">3. 24-48h:</span>
              <span className="text-gray-600">Paystack processes the payout</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold min-w-fit mt-0.5">4. 48-72h:</span>
              <span className="text-gray-600">Funds deposited in your bank account</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const cardContent = (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        {title}
      </h3>
      <p className="text-gray-600 text-sm mb-6">
        {userRole === 'tutor' 
          ? 'Your earnings are automatically credited to your configured bank account through Paystack or Flutterwave. Typical timeline:'
          : 'Your course revenue is automatically deposited to your configured bank account. Typical timeline:'}
      </p>
      <div className="space-y-4">
        {timelineSteps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center border ${step.borderColor}`}>
              <div className={`text-${step.color.split('-')[1]}-600`}>{step.icon}</div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="font-semibold text-gray-900 text-sm">{step.label}</h4>
              <p className={`text-xs font-medium ${step.textColor}`}>{step.duration}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Settlement times may vary based on your bank and payment gateway processing. 
          Weekend and holiday deposits may take longer.
        </p>
      </div>
    </div>
  );

  const compactContent = (
    <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-lg p-4 border border-yellow-200">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">24-72 Hour Settlement</p>
          <p className="text-xs text-gray-600 mt-1">
            Payouts are processed within 24-72 hours of payment confirmation. 
            {userRole === 'tutor' ? ' Your earnings will be sent to your connected bank account.' : ' Revenue will be sent to your configured account.'}
          </p>
        </div>
      </div>
    </div>
  );

  return variant === 'card' ? cardContent : variant === 'compact' ? compactContent : bannerContent;
};

export default PayoutScheduleInfo;
