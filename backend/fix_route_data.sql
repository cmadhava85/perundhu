-- Fix the approved route by adding missing required data
UPDATE route_contributions 
SET 
  departure_time = '08:00',
  arrival_time = '09:30',
  from_latitude = 9.4484,
  from_longitude = 77.8072,
  to_latitude = 9.5089,
  to_longitude = 78.0931,
  status = 'APPROVED',
  validation_message = 'Ready for integration with complete data'
WHERE id = 'c500a4dc-844f-4757-9f42-871663d2901f';
