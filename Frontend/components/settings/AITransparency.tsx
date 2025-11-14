'use client';

import { Card } from '@/components/ui/Card';
import { Sparkles, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export function AITransparency() {
  const examples = [
    {
      icon: TrendingUp,
      title: 'Why did Omni-Valio recommend this alternative?',
      explanation: 'Our AI analyzes multiple factors to suggest the best alternatives:',
      points: [
        '95% market-basket similarity based on your past orders',
        'Same nutritional profile (fat %, protein, allergens)',
        'Better supplier reliability (fill rate 92% vs 62%)',
        'Identical pack size and temperature requirements',
        'Preferred by 78% of similar restaurants',
      ],
      color: 'valio',
    },
    {
      icon: AlertTriangle,
      title: 'Why was risk high for some items?',
      explanation: 'Risk predictions are based on real-time data analysis:',
      points: [
        'Supplier delays detected in the last 7 days',
        'Fill rate dropped below 65% (historically 85%)',
        'Increased demand from other customers in your region',
        'Seasonal availability factors',
        'Historical delivery pattern analysis',
      ],
      color: 'amber',
    },
    {
      icon: Package,
      title: 'How does the AI detect damaged items?',
      explanation: 'Our computer vision model identifies issues with high accuracy:',
      points: [
        'Damaged packaging detection (94% confidence)',
        'Liquid leakage identification',
        'Item count verification using object detection',
        'Freshness indicators (for perishables)',
        'Trained on 50,000+ delivery images',
      ],
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-valio-100 rounded-soft-lg">
            <Sparkles className="w-6 h-6 text-valio-600" />
          </div>
          <div>
            <h3 className="text-heading text-glacier-900 mb-2">AI Transparency</h3>
            <p className="text-body text-glacier-600">
              Understanding how Omni-Valio's AI makes decisions for you
            </p>
          </div>
        </div>

        <div className="p-4 bg-valio-50 border border-valio-200 rounded-soft-lg">
          <p className="text-body-sm text-valio-900">
            At Omni-Valio, we believe in transparent AI. Our system is designed to help you make
            better decisions, not to replace your judgment. Every recommendation comes with clear
            explanations so you understand why it was suggested.
          </p>
        </div>
      </Card>

      {/* Example Explanations */}
      {examples.map((example, index) => {
        const Icon = example.icon;
        const colorMap = {
          valio: {
            bg: 'bg-valio-50',
            border: 'border-valio-200',
            text: 'text-valio-900',
            icon: 'text-valio-600',
            iconBg: 'bg-valio-100',
          },
          amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            icon: 'text-amber-600',
            iconBg: 'bg-amber-100',
          },
          green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900',
            icon: 'text-green-600',
            iconBg: 'bg-green-100',
          },
        };
        const colorClasses = colorMap[example.color as keyof typeof colorMap];

        return (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-2 ${colorClasses.border} ${colorClasses.bg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 ${colorClasses.iconBg} rounded-soft-lg`}>
                  <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-heading text-glacier-900 mb-2">
                    {example.title}
                  </h4>
                  <p className="text-body-sm text-glacier-700 mb-4">
                    {example.explanation}
                  </p>

                  <ul className="space-y-2">
                    {example.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          example.color === 'valio' ? 'bg-valio-600' :
                          example.color === 'amber' ? 'bg-amber-600' :
                          'bg-green-600'
                        } mt-1.5`} />
                        <span className="text-body-sm text-glacier-800 flex-1">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}

      {/* Additional Info */}
      <Card className="bg-gradient-to-r from-glacier-50 to-white">
        <h4 className="font-semibold text-glacier-900 mb-3">
          Data Privacy & Control
        </h4>
        <div className="space-y-2 text-body-sm text-glacier-700">
          <p>
            • All AI recommendations are based on aggregated, anonymized data from the Valio network
          </p>
          <p>
            • Your specific order history is never shared with other customers
          </p>
          <p>
            • You can always override AI suggestions - you're in complete control
          </p>
          <p>
            • Contact us anytime to learn more about how specific recommendations were made
          </p>
        </div>
      </Card>
    </div>
  );
}
