/**
 * HoneypotFields Component
 * Renders invisible form fields for bot detection
 * Include this component in any form that accepts user submissions
 */

import React from 'react';
import { HONEYPOT_FIELDS, getHoneypotStyle, isHoneypotEnabled } from '../../utils/honeypot';

interface HoneypotFieldsProps {
  /** Form register function (from react-hook-form) or onChange handler */
  register?: (name: string) => Record<string, unknown>;
  /** Direct onChange handler if not using react-hook-form */
  onChange?: (name: string, value: string) => void;
  /** Current values (for controlled components) */
  values?: Record<string, string>;
}

/**
 * Hidden honeypot fields component
 * Bots will fill these fields, but humans won't see them
 */
export const HoneypotFields: React.FC<HoneypotFieldsProps> = ({
  register,
  onChange,
  values = {},
}) => {
  if (!isHoneypotEnabled()) {
    return null;
  }

  const honeypotStyle = getHoneypotStyle();

  // Handler for uncontrolled/controlled inputs
  const handleChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(fieldName, e.target.value);
    }
  };

  // If using react-hook-form register
  if (register) {
    return (
      <div aria-hidden="true" style={honeypotStyle}>
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register(HONEYPOT_FIELDS.WEBSITE)}
        />
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register(HONEYPOT_FIELDS.PHONE_NUMBER)}
        />
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register(HONEYPOT_FIELDS.FAX)}
        />
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register(HONEYPOT_FIELDS.COMPANY_URL)}
        />
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register(HONEYPOT_FIELDS.HP_FIELD)}
        />
      </div>
    );
  }

  // Controlled/uncontrolled inputs
  return (
    <div aria-hidden="true" style={honeypotStyle}>
      <input
        type="text"
        name={HONEYPOT_FIELDS.WEBSITE}
        autoComplete="off"
        tabIndex={-1}
        value={values[HONEYPOT_FIELDS.WEBSITE] || ''}
        onChange={handleChange(HONEYPOT_FIELDS.WEBSITE)}
      />
      <input
        type="text"
        name={HONEYPOT_FIELDS.PHONE_NUMBER}
        autoComplete="off"
        tabIndex={-1}
        value={values[HONEYPOT_FIELDS.PHONE_NUMBER] || ''}
        onChange={handleChange(HONEYPOT_FIELDS.PHONE_NUMBER)}
      />
      <input
        type="text"
        name={HONEYPOT_FIELDS.FAX}
        autoComplete="off"
        tabIndex={-1}
        value={values[HONEYPOT_FIELDS.FAX] || ''}
        onChange={handleChange(HONEYPOT_FIELDS.FAX)}
      />
      <input
        type="text"
        name={HONEYPOT_FIELDS.COMPANY_URL}
        autoComplete="off"
        tabIndex={-1}
        value={values[HONEYPOT_FIELDS.COMPANY_URL] || ''}
        onChange={handleChange(HONEYPOT_FIELDS.COMPANY_URL)}
      />
      <input
        type="text"
        name={HONEYPOT_FIELDS.HP_FIELD}
        autoComplete="off"
        tabIndex={-1}
        value={values[HONEYPOT_FIELDS.HP_FIELD] || ''}
        onChange={handleChange(HONEYPOT_FIELDS.HP_FIELD)}
      />
    </div>
  );
};

export default HoneypotFields;
