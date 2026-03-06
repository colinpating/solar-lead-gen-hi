"use client";

import { useState } from 'react';

const HAWAII_RATE_PER_KWH = 0.40;
const SOLAR_OFFSET_PERCENT = 0.85;
const SYSTEM_COST_PER_WATT = 3.00;
const FEDERAL_ITC_PERCENT = 0.30;
const ANNUAL_RATE_ESCALATION = 0.03;
const SYSTEM_DEGRADATION = 0.005;
const SUN_HOURS_HAWAII = 5.5;
const SYSTEM_LIFETIME_YEARS = 25;

function calculate(monthlyBill: number) {
  const monthlyKwh = monthlyBill / HAWAII_RATE_PER_KWH;
  const annualKwh = monthlyKwh * 12;
  const systemKw = (annualKwh * SOLAR_OFFSET_PERCENT) / (SUN_HOURS_HAWAII * 365);
  const grossCost = systemKw * 1000 * SYSTEM_COST_PER_WATT;
  const netCost = grossCost * (1 - FEDERAL_ITC_PERCENT);

  let totalSavings = 0;
  let paybackYear = SYSTEM_LIFETIME_YEARS;
  let cumulative = 0;

  for (let y = 1; y <= SYSTEM_LIFETIME_YEARS; y++) {
    const rate = HAWAII_RATE_PER_KWH * Math.pow(1 + ANNUAL_RATE_ESCALATION, y - 1);
    const production = annualKwh * SOLAR_OFFSET_PERCENT * Math.pow(1 - SYSTEM_DEGRADATION, y - 1);
    const yearSavings = production * rate;
    totalSavings += yearSavings;
    cumulative += yearSavings;
    if (cumulative >= netCost && paybackYear === SYSTEM_LIFETIME_YEARS) {
      paybackYear = y;
    }
  }

  return {
    annualSavings: Math.round(annualKwh * SOLAR_OFFSET_PERCENT * HAWAII_RATE_PER_KWH),
    paybackYears: paybackYear,
    lifetimeSavings: Math.round(totalSavings - netCost),
    systemCost: Math.round(netCost),
  };
}

export function SavingsCalculator() {
  const [bill, setBill] = useState(300);
  const results = calculate(bill);

  return (
    <section className="savings-calc">
      <h2>Estimate Your Solar Savings</h2>
      <div className="calc-input-group">
        <label htmlFor="bill-slider">
          Monthly electric bill: <strong>${bill}</strong>
        </label>
        <input
          id="bill-slider"
          type="range"
          className="calc-slider"
          min={75}
          max={600}
          step={25}
          value={bill}
          onChange={(e) => setBill(Number(e.target.value))}
        />
        <span className="calc-range-labels">
          <span>$75</span>
          <span>$600</span>
        </span>
      </div>
      <div className="calc-results">
        <div className="stat-card">
          <span className="stat-value">${results.annualSavings.toLocaleString()}</span>
          <span className="stat-label">Est. Year 1 Savings</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{results.paybackYears} yrs</span>
          <span className="stat-label">Payback Period</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${results.lifetimeSavings.toLocaleString()}</span>
          <span className="stat-label">25-Year Net Savings</span>
        </div>
      </div>
      <p className="calc-disclaimer">
        Estimates are for illustration only and assume ~$0.40/kWh HECO rate, 30% federal tax credit,
        5.5 peak sun hours, and 0.5% annual panel degradation. Actual savings depend on system design,
        roof orientation, shading, and utility rate changes.
      </p>
      <a href="#lead-form-bottom" className="cta">Get My Personalized Estimate</a>
    </section>
  );
}
