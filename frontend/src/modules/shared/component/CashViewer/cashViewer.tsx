/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useContext } from 'react';
import { Typography, Box } from '@mui/material';
import classNames from 'classnames';
import { NAIRA } from '@/constants';
import { formatAmount, shortenNumber } from '@/utils/hooks/formatNumber';

export const CurrencyContext = React.createContext<{ currency?: any }>({
  currency: {
    id: 0,
    symbol: '',
    name: '',
    code: '',
    countryCode: '',
    countryName: '',
    updatedAt: null,
    createdAt: null,
    deletedAt: null,
  },
});

interface CashViewerProps {
  amount?: number | string;
  dealAmount?: number | string;
  isDeal?: boolean;
  decimal?: number;
  currencySymbol?: string;
  isSupSymbol?: boolean;
  isDiscrete?: boolean;
  symbolClassName?: string;
  valueClassName?: string;
  className?: string;
  noCurrencySymbol?: boolean;
  shortenFrom?: number;
}

export const CashViewer: FC<CashViewerProps> = ({
  amount = 0,
  dealAmount,
  isDeal = false,
  decimal = 0,
  currencySymbol,
  isSupSymbol = false,
  isDiscrete = false,
  symbolClassName,
  valueClassName,
  noCurrencySymbol = false,
  shortenFrom,
  className,
  ...props
}) => {
  const { currency: currencyObject } = useContext(CurrencyContext) || {};

  const displayCurrencySymbol =
    currencySymbol || currencyObject?.symbol || NAIRA.symbol;

  const renderAmount = (value: number | string) =>
    shortenFrom
      ? shortenNumber(value as number) || 0.0
      : formatAmount(value, decimal) || 0.0;

  // --- DEAL VIEW ---
  if (isDeal && dealAmount) {
    return (
      <Box {...props} className={classNames('flex items-center gap-2', className)}>
        {/* Discounted price */}
        <Typography component="span" className="flex items-center">
          {noCurrencySymbol ? null : isSupSymbol ? (
            <sup>
              <span
                className={classNames(
                  'relative top-1 text-[13px]',
                  symbolClassName,
                )}
              >
                {displayCurrencySymbol}
              </span>
            </sup>
          ) : (
            <span className={symbolClassName}>{displayCurrencySymbol}</span>
          )}
          <span
            className={classNames(valueClassName, {
              ['blur-[12px]']: isDiscrete,
            })}
          >
            {renderAmount(dealAmount)}
          </span>
        </Typography>

        {/* Original (strikethrough) price */}
        <Typography
          component="span"
          className={classNames(
            'text-sm text-[#5d5d5d] line-through opacity-70',
            valueClassName,
          )}
        >
          {noCurrencySymbol ? null : (
            <span className={symbolClassName}>{displayCurrencySymbol}</span>
          )}
          {renderAmount(amount)}
        </Typography>
      </Box>
    );
  }

  // --- REGULAR VIEW ---
  return (
    <Typography {...props} component="span" className={className}>
      {noCurrencySymbol ? null : isSupSymbol ? (
        <sup>
          <span
            className={classNames('relative top-1 text-[13px]', symbolClassName)}
          >
            {displayCurrencySymbol}
          </span>
        </sup>
      ) : (
        <span className={symbolClassName}>{displayCurrencySymbol}</span>
      )}
      <span
        className={classNames(valueClassName, {
          ['blur-[12px]']: isDiscrete,
        })}
      >
        {renderAmount(amount)}
      </span>
    </Typography>
  );
};
