# TimePicker Component API Reference

**Location:** `frontend/src/design-system/components/TimePicker.tsx`
**Status:** ✅ Production Ready
**Build Status:** Verified (0 errors, 1,889 modules)

---

## 📦 Component Export

```typescript
import { TimePicker } from '../design-system';
// or
import { TimePicker, type TimePickerProps } from '../design-system';
```

---

## 🎯 Basic Usage

### Minimal Example
```tsx
import React, { useState } from 'react';
import { TimePicker } from '../design-system';

export function MyForm() {
  const [time, setTime] = useState('09:30:00');
  
  return (
    <TimePicker
      value={time}
      onChange={setTime}
    />
  );
}
```

### With Label and Validation
```tsx
<TimePicker
  label="Departure Time"
  value={departureTime}
  onChange={setDepartureTime}
  error={validationError}
  helperText="When the bus departs from this stop"
/>
```

---

## 📋 Props Reference

### TimePickerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **value** | `string` | `""` | Time value in HH:MM:SS format (e.g., "09:30:00") |
| **onChange** | `(time: string) => void` | Required | Callback when time changes |
| **label** | `string` | `undefined` | Label text displayed above input |
| **format** | `"12h" \| "24h"` | `"24h"` | Display format (12-hour or 24-hour) |
| **showSeconds** | `boolean` | `false` | Show/hide seconds column |
| **step** | `15 \| 30 \| 60` | `15` | Minute increment (15, 30, or 60) |
| **minHour** | `number` | `0` | Minimum selectable hour (0-23) |
| **maxHour** | `number` | `23` | Maximum selectable hour (0-23) |
| **error** | `boolean` | `false` | Show error state (red border/background) |
| **errorMessage** | `string` | `undefined` | Error message text displayed below input |
| **helperText** | `string` | `undefined` | Helper text displayed below input |
| **disabled** | `boolean` | `false` | Disable time picker |
| **required** | `boolean` | `false` | Mark as required field |
| **id** | `string` | Auto-generated | HTML id attribute |
| **name** | `string` | `undefined` | Form field name |
| **className** | `string` | `""` | Additional CSS class names |

---

## 🔄 Value Format

### Input/Output Format: HH:MM:SS

**24-hour format (default):**
```typescript
"09:30:00"  // 9:30 AM
"17:45:00"  // 5:45 PM
"23:59:59"  // 11:59:59 PM
"00:00:00"  // Midnight
```

**12-hour format:**
```typescript
// Stored as 24-hour internally, displayed as 12-hour
"09:30:00"  // Displayed as "09:30 AM"
"17:45:00"  // Displayed as "05:45 PM"
"23:59:59"  // Displayed as "11:59 PM"
"00:00:00"  // Displayed as "12:00 AM"
```

### Parsing Time Values

```typescript
// If you need to extract hours/minutes/seconds
const parseTime = (timeStr: string) => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return { hours, minutes, seconds };
};

const time = "09:30:45";
const { hours, minutes, seconds } = parseTime(time);
console.log(hours);    // 9
console.log(minutes);  // 30
console.log(seconds);  // 45
```

### Creating Time Values

```typescript
// From numbers
const hours = 9;
const minutes = 30;
const seconds = 0;
const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
// Result: "09:30:00"

// From Date
const date = new Date();
const timeStr = date.toLocaleTimeString('en-GB', { hour12: false });
// Result: "14:30:45"
```

---

## ⌨️ Keyboard Shortcuts

**When time picker is focused:**

| Key | Action | Column |
|-----|--------|--------|
| `↑ Up` | Increment | Current |
| `↓ Down` | Decrement | Current |
| `→ Right` | Move to next column | Hours → Minutes → Seconds |
| `← Left` | Move to previous column | Seconds → Minutes → Hours |
| `Enter` | Confirm and close picker | - |
| `Escape` | Cancel and close picker | - |

**Default active column:** Hours

---

## 🎨 CSS Customization

### Using CSS Variables

```css
/* In your component's CSS file */
.my-form .timepicker-wrapper {
  --transit-primary: #0D9488;           /* Focus color */
  --transit-text-primary: #1D1D1F;      /* Text color */
  --transit-divider: #E5E5EA;           /* Border color */
  --transit-danger: #EF4444;            /* Error color */
}
```

### Available CSS Classes

```css
.timepicker-wrapper                    /* Root container */
.timepicker-label                      /* Label element */
.timepicker-input                      /* Input field */
.timepicker-icon                       /* Clock icon */
.timepicker-panel                      /* Dropdown panel */
.timepicker-spinner                    /* Scrollable column */
.timepicker-option                     /* Individual time option */
.timepicker-option.selected            /* Selected option */
.timepicker-actions                    /* Button container */
.timepicker-confirm                    /* Confirm button */
.timepicker-cancel                     /* Cancel button */
.timepicker-error                      /* Error message */
.timepicker-helper                     /* Helper text */
```

---

## 🚀 Common Use Cases

### Case 1: Bus Route Departure Time

```tsx
const [departureTime, setDepartureTime] = useState('');

return (
  <TimePicker
    label="Route Departure Time"
    value={departureTime}
    onChange={setDepartureTime}
    format="24h"
    showSeconds={false}
    minHour={5}      // Bus service starts at 5 AM
    maxHour={23}     // Bus service ends at 11 PM
    step={15}        // 15-minute increments
    error={!departureTime && attemptedSubmit}
    errorMessage={!departureTime ? "Departure time is required" : ""}
    helperText="When does the bus depart from the origin?"
  />
);
```

### Case 2: Stop Arrival/Departure Times

```tsx
const [stopArrival, setStopArrival] = useState('');
const [stopDeparture, setStopDeparture] = useState('');

return (
  <>
    <TimePicker
      label="Arrival Time at Stop"
      value={stopArrival}
      onChange={setStopArrival}
      format="24h"
      showSeconds={false}
      step={15}
      error={arrivalTimeError}
      errorMessage={arrivalTimeError}
    />
    
    <TimePicker
      label="Departure Time from Stop"
      value={stopDeparture}
      onChange={setStopDeparture}
      format="24h"
      showSeconds={false}
      step={15}
      error={departureTimeError}
      errorMessage={departureTimeError}
    />
  </>
);
```

### Case 3: Accessibility Options (12-hour format for users)

```tsx
const [time, setTime] = useState('');
const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');

return (
  <>
    <label>
      <input
        type="radio"
        value="24h"
        checked={timeFormat === '24h'}
        onChange={(e) => setTimeFormat('24h')}
      />
      24-hour format
    </label>
    <label>
      <input
        type="radio"
        value="12h"
        checked={timeFormat === '12h'}
        onChange={(e) => setTimeFormat('12h')}
      />
      12-hour format
    </label>

    <TimePicker
      label="Select Time"
      value={time}
      onChange={setTime}
      format={timeFormat}
      showSeconds={false}
    />
  </>
);
```

---

## ✅ Validation Patterns

### Validation Helper Functions

```typescript
// Check if time is valid format
const isValidTimeFormat = (time: string): boolean => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return regex.test(time);
};

// Check if arrival is after departure
const isArrivalAfterDeparture = (
  departureTime: string,
  arrivalTime: string
): boolean => {
  const [dh, dm] = departureTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);
  
  const depMinutes = dh * 60 + dm;
  const arrMinutes = ah * 60 + am;
  
  return arrMinutes >= depMinutes;
};

// Validation in form
const handleSubmit = () => {
  const errors: Record<string, string> = {};
  
  if (!departureTime) {
    errors.departure = "Departure time is required";
  } else if (!isValidTimeFormat(departureTime)) {
    errors.departure = "Invalid time format";
  }
  
  if (arrivalTime && !isArrivalAfterDeparture(departureTime, arrivalTime)) {
    errors.arrival = "Arrival must be after departure";
  }
  
  setErrors(errors);
  
  if (Object.keys(errors).length === 0) {
    // Submit form
    submitContribution({ departureTime, arrivalTime });
  }
};
```

---

## 🔧 Integration with Forms

### With React Hook Form

```typescript
import { useForm, Controller } from 'react-hook-form';
import { TimePicker } from '../design-system';

function MyForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      departureTime: '09:30:00',
      arrivalTime: '17:45:00'
    }
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="departureTime"
        control={control}
        rules={{
          required: 'Departure time required',
          validate: (value) => isValidTimeFormat(value) || 'Invalid format'
        }}
        render={({ field, fieldState }) => (
          <TimePicker
            label="Departure Time"
            {...field}
            error={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Standard Form State

```typescript
function MyForm() {
  const [formData, setFormData] = useState({
    departureTime: '',
    arrivalTime: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleTimeChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user modifies field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.departureTime) {
      newErrors.departureTime = 'Required';
    }
    if (!formData.arrivalTime) {
      newErrors.arrivalTime = 'Required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit
    submitForm(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <TimePicker
        label="Departure"
        value={formData.departureTime}
        onChange={handleTimeChange('departureTime')}
        error={!!errors.departureTime}
        errorMessage={errors.departureTime}
      />
      
      <TimePicker
        label="Arrival"
        value={formData.arrivalTime}
        onChange={handleTimeChange('arrivalTime')}
        error={!!errors.arrivalTime}
        errorMessage={errors.arrivalTime}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 📱 Mobile Behavior

### Touch Interactions
- **Tap input:** Opens picker panel in bottom sheet on mobile (<640px)
- **Swipe up/down:** Scroll through time options in spinner
- **Tap option:** Select time and close picker

### Responsive Behavior
```css
/* < 640px: Bottom sheet */
.timepicker-panel {
  position: fixed;
  bottom: 0;
  max-height: 50vh;
  border-radius: 16px 16px 0 0;
}

/* >= 640px: Dropdown */
.timepicker-panel {
  position: absolute;
  top: calc(100% + 8px);
}
```

---

## 🎯 TypeScript Types

```typescript
/**
 * TimePicker component props
 */
interface TimePickerProps {
  /** Time value in HH:MM:SS format */
  value: string;
  
  /** Callback when time changes */
  onChange: (time: string) => void;
  
  /** Label text */
  label?: string;
  
  /** Display format: 12-hour or 24-hour */
  format?: '12h' | '24h';
  
  /** Show seconds column */
  showSeconds?: boolean;
  
  /** Minute increment: 15, 30, or 60 */
  step?: 15 | 30 | 60;
  
  /** Minimum selectable hour (0-23) */
  minHour?: number;
  
  /** Maximum selectable hour (0-23) */
  maxHour?: number;
  
  /** Show error state */
  error?: boolean;
  
  /** Error message text */
  errorMessage?: string;
  
  /** Helper text below input */
  helperText?: string;
  
  /** Disable the picker */
  disabled?: boolean;
  
  /** Mark as required */
  required?: boolean;
  
  /** HTML id attribute */
  id?: string;
  
  /** Form field name */
  name?: string;
  
  /** Additional CSS classes */
  className?: string;
}
```

---

## 🔍 Debugging

### Console Logging
```typescript
const handleTimeChange = (time: string) => {
  console.log('TimePicker value:', time);
  console.log('Parsed:', {
    hours: parseInt(time.split(':')[0]),
    minutes: parseInt(time.split(':')[1]),
    seconds: parseInt(time.split(':')[2])
  });
  setTime(time);
};

return (
  <TimePicker
    value={time}
    onChange={handleTimeChange}
  />
);
```

### Validating Integration
```typescript
// Check that TimePicker is exported
import { TimePicker } from '../design-system';
console.log(TimePicker); // Should be a React component function

// Check that CSS is loaded
const style = window.getComputedStyle(document.querySelector('.timepicker-input'));
console.log(style.borderColor); // Should show teal (#14B8A6) on focus
```

---

## 📋 Checklist for Using TimePicker

- [ ] Import TimePicker: `import { TimePicker } from '../design-system'`
- [ ] Create state: `const [time, setTime] = useState('09:30:00')`
- [ ] Add component: `<TimePicker value={time} onChange={setTime} />`
- [ ] Test keyboard: Arrow keys, Enter, Escape
- [ ] Test mobile: Bottom sheet appears on <640px
- [ ] Test validation: Error states display correctly
- [ ] Test form submission: Time value is included in data
- [ ] Test accessibility: Focus visible, ARIA labels present

---

## 📚 Related Components

- **Button:** Used in TimePicker for confirm/cancel actions
- **Skeleton:** Can be used while loading time options
- **Select:** Alternative for choosing from predefined time slots
- **LocationDropdown:** Similar dropdown pattern with portal

---

## 🚀 Next: Integration Steps

To integrate TimePicker into existing time input fields:

1. **UnifiedRouteForm.tsx** (2 fields)
   - Replace `input[type="time"]` for departureTime
   - Replace `input[type="time"]` for arrivalTime

2. **StopEntryForm.tsx** (2 fields)
   - Replace `input[type="time"]` for arrivalTime
   - Replace `input[type="time"]` for departureTime

3. **AddStopsToRoute.tsx** (2+ fields)
   - Replace time inputs in stop addition form

See **SEARCH_PAGES_COMPONENT_AUDIT.md** → "Migration Checklist" for detailed steps.

---

**Last Updated:** December 30, 2024
**Component Status:** ✅ Production Ready
**Build Verified:** 1,889 modules, 0 errors

