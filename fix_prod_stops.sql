-- ============================================================
-- PROD SQL PATCH: Fix stops.name to use landmark (actual stop)
-- 'location' field repeats the route zone across many stops.
-- 'landmark' holds the real waypoint name (e.g. GUDUVANCHERY,
--  SRM UNIVERSITY, CHENGALPATTU TOLL, CHENNAI KALAIGNAR CBT).
-- Generated from data/consolidated_buses.json - March 2026
-- ============================================================

START TRANSACTION;

-- Step 1: Insert any landmark names missing from locations table
INSERT IGNORE INTO locations (name, latitude, longitude, district, state, type)
VALUES
  ('ADIRAMAPATTINAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ALANKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ALATHUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ALWAYE BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AMBASAMUDARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANDALUR GATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANDIMADAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANDIPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANGAMALI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANNUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ANTHIYUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARAKONAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARALVAIMOZHI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARANI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARANTHANGI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARAPALAYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARAPALAYAM BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARIYALUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARUMUGANERI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARUPPUKOTAI GANDINAGAR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARUPPUKOTTAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ARUPPUKOTTAI BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ATHUR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ATHUR(TNV)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ATTIBELE TOLL PLAZA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ATTUR (SALEM)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AVINASHI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AVINASHI NEW BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AVUDAIYAR KOIL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AYOTHIYAPATTINAM BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('AZHAHIYA MANDAPAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('BATLAGUNTU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('BHAVANI BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('BHAVANI BYE PASS LAKSHMI NAGAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('BODI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHALAKUDI BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENGALPATTU BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENGALPATTU TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI AVADI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI KALAIGNAR CBT', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI TAMBARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI TIRUVANMIYUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI TIRUVOTRIYUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHENNAI-PT Dr.M.G.R. BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHIDAMBARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHINNIYAMPALAYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHITT0OR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHITTAMPATTI TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CHROMEPET MTC BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('COIMBATORE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('COIMBATORE MEDICAL COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('COLACHAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('COLLECTOR OFFICE BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('COONOOR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CUDDALORE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('CUMBAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('DEVAKOTTAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('DHARAPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('DHARMAPURI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('DINDIGUL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('DINDIGUL PALANI BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ELECTRONIC CITY BMTC DEPOT', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ELECTRONIC TOLL PLAZA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('EMBAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('EPPODUMVENDRAN', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ERNAKULAM SOUTH KSRTC B.S', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ERODE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ETTAYAPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('FATHIMA COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GANDHARVAKOTTAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GANDHIPURAM CBS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GANDHIPURAM SETC BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GOBI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GUDALORE (OOTY)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GUDUVANCHERY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GUNASEELAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('GURUVAYUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('HOPE COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('HOSUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('HUNSUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ILAYANKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('JAYANKONDAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KADAYA NALLUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KADAYANALLUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KALAKKADU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KALIAKAVILAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KALLAKKUDI BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KALLAKURICHI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KALLUPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KANCHEEPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KANYAKUMARI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARAIKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARAMBAKKUDI BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARUMATHAMPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARUNGAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARUNGALAKUDI BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KARUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KATTANGULATTUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KAVALKINARU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KAYALPATTINAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KAYATHAR TOLL PLAZA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KEERAMANGALAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KEEZHAPAZHUR BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KELAERAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KMC HOSPITAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KODAI ROAD TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KODAIKANAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KODUMUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOLAKKANATHAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOLLAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KONDALAMPATTI BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOTTARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOVILPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOVILPATTI BYPASS BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KOVILPATTI NEW BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KRISHAN KOIL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KRISHNAGIRI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KRISHNAGIRI TOLL PLAZA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KULASEKARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KULITHALAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUMBAKONAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUMILI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUNNAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUNNAM BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUSHALNAGAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('KUTTAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('LAKSHMI MILLS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('LAKSHMI NAGER', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MADUKKUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MAHINDRA CITY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MALLIPATTINAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MAM COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MANAKULA VINAYAGAR  COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MANAMADURAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MANDHARAKUPPAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MANIVAKKAM (INFRONT OF DARBAR)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MANNARKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MARAIMALAI NAGAR BUSSTOP', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MARTHANDAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MATTUTHAVANI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MATTUTHAVANI BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MELMARUVATHUR BUS STOP', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MELUR BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MELUR BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MERCARA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('METTTUPALYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('METTUPATTI TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('METTUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MUDUGALATHUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MULAGUMOODU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MUNNAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MUSIRI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MUSIRI BRIDGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MUSIRI BYEPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MYLADUTHURAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('MYSORE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NAGAPATTINAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NAGERCOIL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NAGOOR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NAMAKKAL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NANGUNERI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NANGUNERI TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NEEDAMANGALAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NEELAMBUR BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NEYVELI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NEYYANTIKARAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('NO 1 TOLL GATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('OOTY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('OPPILAN', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ORAGADAM JUNCTION (IOB)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('OTTHAKADAI  BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PADALUR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PADAPPAI (JAMUNA JEWELERY)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALANI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALGHAT KSRTC B.S', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALLADAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALLADAM BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALLAPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PALPANNAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PANAKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PAPANASAM-TNV', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PARAMAKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PARTHIBANUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PEELAMEDU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PENNADAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERAMBALUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERAMBALUR 4WAY JUNCTION', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERAMBALUR X ROAD', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERIYAKULAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERIYAPATNA -KAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERUMANALLUR TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERUNDURAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PERUNGALATHUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PETTAVAITHALAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('POLLACHI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('POONAMALLEE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('POONMALEE BYPASS MTC DEPOT NR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PUDUCHERRY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PUDUKKOTTAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PULIAMPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PULIYANKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PULLAMBADI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('PUNALUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('RAJAPALAYAM NEW BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('RAMESWARAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('RAMNAD', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('RANIPET', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('RASIPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SALEM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SAMAYANALLUR BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SAMAYAPURAM BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SAMAYAPURAM TOLL GATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SANKAR NAGER', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SATELLITE BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SATHIYAMANGALAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SATHUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SATHUR BYPASS BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SATTUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SAVEETHA DENTAL COLLEGE(OPP)', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SAYALKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SEELANAICKENPATTI BYE PASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SHANTHI NAGAR BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SHENCOTTAH', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SINGANALLUR BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SINGAPERUMAL KOIL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SIRAYANKULI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SIVAGANGA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SIVAKASI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SOLAR NEW BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SPIC NAGAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRIPERAMBUDUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRIPERUMBUDUR TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRIRANGAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRIVILLIPUTHUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRM COLLEGE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRM UNIVERSITY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SRP TOOLS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ST. JOHN HOSPITAL B.S', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SULUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('SUSINDRUM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TAMBARAM MEPZ BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TENKASI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THACHANALLUR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THALAIVASAL TOLLGATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THANJAVUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THANJAVUR NEW BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THENI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THENKASI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THINGALNAGAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THIRUVANNAMALAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THIRUVATTAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THOLUDUR TOLL GATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THONDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THOTTIYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THOVALAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THUCKKALAY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THURAIYUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('THYSAYANVILAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TINDIVANAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUCHENDUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUCHENGODE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUMANGALAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUMANUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUMAYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUNELVELI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUNELVELI OLD BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPATHI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPATHURRMD', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPPUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPPUR KOVILVALI BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPPUR NEW BUSSTAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPPUR OLD BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUPPUR OLD BUSSTAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUTHANI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUTHURAIPOONDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUVADANAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUVAIYARU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUVALLUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TIRUVARUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TITTAKUDI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TRICHY CHATHIRAM BS KARUR STOP', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TRICHY KKBT', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TRISSUR KSRTC B.S', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TRIVANDRUM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TUTI CORIN', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TUTICORIN', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('TVS TOLL GATE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('UDUMALPET', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('UKKADAM BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('ULUNDURPET', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('URANIPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('USILAMPATTI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VADACHERRY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VALAVANUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VALLAKOTTAI (SRI VINAYAGA STOR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VALLIYOOR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VANNARPETTAI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VARUSANADU', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VASUDEVANALLUR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VEDARANYAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VEDASENDUR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VEERACHOLAN', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VEERAVANALLUR PC BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VEERAVANALLUR PS BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VELACHERY', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VELANKANNI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VELLAMADAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VELLORE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VERKILAMBI', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIJAYAMANGALAM TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VILLIYANUR BYPASS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VILLUPURAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRALIMALAI TOLL PLAZA', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHACHALAM', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHACHALAM BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHNAGAR BYPASS BS', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHUNAGAR', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHUNAGAR COLLECTOR OFFICE', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('VIRUDHUNAGAR NEW BUS STAND', 0.0, 0.0, '', 'Tamil Nadu', 'City'),
  ('WALAJAHPET TOLL', 0.0, 0.0, '', 'Tamil Nadu', 'City');

-- Step 2: Update stops.name and location_id to the correct landmark
-- Chunk 1/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '508J' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508L' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508M' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508N' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510J' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323TUD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '338NS' AND s.stop_order = 1 THEN 'KALLAKKUDI BUS STAND'
    WHEN b.bus_number = '338NS' AND s.stop_order = 2 THEN 'KEEZHAPAZHUR BS'
    WHEN b.bus_number = '338NS' AND s.stop_order = 4 THEN 'KUNNAM BYE PASS'
    WHEN b.bus_number = '338NS' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323NS' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 7 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 8 THEN 'KOVILPATTI'
    WHEN b.bus_number = '460AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AC' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '40723' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 10 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '430TAC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '470MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '470MS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '470MS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '470MS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '470MS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '470MS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '470MS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '470MS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '470MS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '470MS' AND s.stop_order = 10 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = '430NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '430NS' AND s.stop_order = 1 THEN 'LAKSHMI NAGER'
    WHEN b.bus_number = '421KUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 1 THEN 'TAMBARAM MEPZ BS'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 2 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 3 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 4 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 5 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 6 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KNS' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '170AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '170AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '170AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '170AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '170AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '170AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '170AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '170AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '170AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '170AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AL' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AL' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AC' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 0 THEN 'CHENNAI TIRUVOTRIYUR'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 2 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 3 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 4 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'H191NS' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '185UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '185UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '185UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '185UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '185UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '185UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '185UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '185UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '185UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '185UD' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '157UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '157UD' AND s.stop_order = 1 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '157UD' AND s.stop_order = 2 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '157UD' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137MS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137MS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137MS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137MS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137MS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137MS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137MS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137MS' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137NS' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137UD' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AB' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AL' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AL' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AL' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '137AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '137AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '137AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '137AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '137AC' AND s.stop_order = 9 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '335AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '335AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '335AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '335AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '335AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '335AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '335AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '335AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '335AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '160AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '160AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '160AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '160AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '160AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '160AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '160AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '160AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '160AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '160AC' AND s.stop_order = 9 THEN 'VILLUPURAM'
    WHEN b.bus_number = '160AC' AND s.stop_order = 10 THEN 'PERIYAKULAM'
    WHEN b.bus_number = '160UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '160UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '160UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '160UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '160UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '160UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '160UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '160UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '757LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '757LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '757LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '757LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '757LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '757LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '757LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '757LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '757LB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '172UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '172UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '172UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '172UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '172UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '172UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '172UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '172UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '172UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '172UD' AND s.stop_order = 9 THEN 'VILLUPURAM'
    WHEN b.bus_number = '164UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '164UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '164UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '164UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '164UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '164UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '164UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '164UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '164UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '163UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '508J' AND s.stop_order = 1)
  OR   (b.bus_number = '508L' AND s.stop_order = 1)
  OR   (b.bus_number = '510F' AND s.stop_order = 1)
  OR   (b.bus_number = '508M' AND s.stop_order = 1)
  OR   (b.bus_number = '508N' AND s.stop_order = 1)
  OR   (b.bus_number = '508D' AND s.stop_order = 1)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 4)
  OR   (b.bus_number = '510J' AND s.stop_order = 1)
  OR   (b.bus_number = '323TUD' AND s.stop_order = 3)
  OR   (b.bus_number = '338NS' AND s.stop_order = 1)
  OR   (b.bus_number = '338NS' AND s.stop_order = 2)
  OR   (b.bus_number = '338NS' AND s.stop_order = 4)
  OR   (b.bus_number = '338NS' AND s.stop_order = 6)
  OR   (b.bus_number = '508B' AND s.stop_order = 1)
  OR   (b.bus_number = '323NS' AND s.stop_order = 3)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 7)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 8)
  OR   (b.bus_number = '460AC' AND s.stop_order = 0)
  OR   (b.bus_number = '460AC' AND s.stop_order = 2)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 0)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 1)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 2)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 4)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 5)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 6)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 7)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 8)
  OR   (b.bus_number = '40723' AND s.stop_order = 0)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 0)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 1)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 2)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 3)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 4)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 5)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 6)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 7)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 8)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 10)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 0)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 1)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 2)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 3)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 4)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 5)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 6)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 7)
  OR   (b.bus_number = '430TAC' AND s.stop_order = 8)
  OR   (b.bus_number = '470MS' AND s.stop_order = 0)
  OR   (b.bus_number = '470MS' AND s.stop_order = 1)
  OR   (b.bus_number = '470MS' AND s.stop_order = 2)
  OR   (b.bus_number = '470MS' AND s.stop_order = 3)
  OR   (b.bus_number = '470MS' AND s.stop_order = 4)
  OR   (b.bus_number = '470MS' AND s.stop_order = 5)
  OR   (b.bus_number = '470MS' AND s.stop_order = 6)
  OR   (b.bus_number = '470MS' AND s.stop_order = 7)
  OR   (b.bus_number = '470MS' AND s.stop_order = 8)
  OR   (b.bus_number = '470MS' AND s.stop_order = 10)
  OR   (b.bus_number = '430NS' AND s.stop_order = 0)
  OR   (b.bus_number = '430NS' AND s.stop_order = 1)
  OR   (b.bus_number = '421KUD' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 1)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 2)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 3)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 4)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 5)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 6)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 9)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 0)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 2)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 4)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 6)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 9)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 0)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 1)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 2)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 3)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 4)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 5)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 6)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 9)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 1)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 2)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 3)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 4)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 5)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 6)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 9)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 1)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 2)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 3)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 4)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 5)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 6)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 9)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 0)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 1)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 2)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 3)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 4)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 5)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 6)
  OR   (b.bus_number = '831KNS' AND s.stop_order = 9)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 10)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 10)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 10)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 10)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 6)
  OR   (b.bus_number = '137LB' AND s.stop_order = 7)
  OR   (b.bus_number = '137LB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '170AB' AND s.stop_order = 0)
  OR   (b.bus_number = '170AB' AND s.stop_order = 1)
  OR   (b.bus_number = '170AB' AND s.stop_order = 2)
  OR   (b.bus_number = '170AB' AND s.stop_order = 3)
  OR   (b.bus_number = '170AB' AND s.stop_order = 4)
  OR   (b.bus_number = '170AB' AND s.stop_order = 5)
  OR   (b.bus_number = '170AB' AND s.stop_order = 6)
  OR   (b.bus_number = '170AB' AND s.stop_order = 7)
  OR   (b.bus_number = '170AB' AND s.stop_order = 8)
  OR   (b.bus_number = '170AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 10)
  OR   (b.bus_number = '137AL' AND s.stop_order = 0)
  OR   (b.bus_number = '137AL' AND s.stop_order = 1)
  OR   (b.bus_number = '137AL' AND s.stop_order = 2)
  OR   (b.bus_number = '137AL' AND s.stop_order = 3)
  OR   (b.bus_number = '137AL' AND s.stop_order = 4)
  OR   (b.bus_number = '137AL' AND s.stop_order = 5)
  OR   (b.bus_number = '137AL' AND s.stop_order = 6)
  OR   (b.bus_number = '137AL' AND s.stop_order = 7)
  OR   (b.bus_number = '137AC' AND s.stop_order = 0)
  OR   (b.bus_number = '137AC' AND s.stop_order = 1)
  OR   (b.bus_number = '137AC' AND s.stop_order = 2)
  OR   (b.bus_number = '137AC' AND s.stop_order = 3)
  OR   (b.bus_number = '137AC' AND s.stop_order = 4)
  OR   (b.bus_number = '137AC' AND s.stop_order = 5)
  OR   (b.bus_number = '137AC' AND s.stop_order = 6)
  OR   (b.bus_number = '137AC' AND s.stop_order = 7)
  OR   (b.bus_number = '137AC' AND s.stop_order = 8)
  OR   (b.bus_number = '137AC' AND s.stop_order = 9)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 0)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 1)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 2)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 3)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 4)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 5)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 6)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 7)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 8)
  OR   (b.bus_number = 'H191NS' AND s.stop_order = 9)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 9)
  OR   (b.bus_number = '185UD' AND s.stop_order = 0)
  OR   (b.bus_number = '185UD' AND s.stop_order = 1)
  OR   (b.bus_number = '185UD' AND s.stop_order = 2)
  OR   (b.bus_number = '185UD' AND s.stop_order = 3)
  OR   (b.bus_number = '185UD' AND s.stop_order = 4)
  OR   (b.bus_number = '185UD' AND s.stop_order = 5)
  OR   (b.bus_number = '185UD' AND s.stop_order = 6)
  OR   (b.bus_number = '185UD' AND s.stop_order = 7)
  OR   (b.bus_number = '185UD' AND s.stop_order = 8)
  OR   (b.bus_number = '185UD' AND s.stop_order = 9)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 6)
  OR   (b.bus_number = '137LB' AND s.stop_order = 7)
  OR   (b.bus_number = '137LB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '157UD' AND s.stop_order = 0)
  OR   (b.bus_number = '157UD' AND s.stop_order = 1)
  OR   (b.bus_number = '157UD' AND s.stop_order = 2)
  OR   (b.bus_number = '157UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137MS' AND s.stop_order = 0)
  OR   (b.bus_number = '137MS' AND s.stop_order = 1)
  OR   (b.bus_number = '137MS' AND s.stop_order = 2)
  OR   (b.bus_number = '137MS' AND s.stop_order = 3)
  OR   (b.bus_number = '137MS' AND s.stop_order = 4)
  OR   (b.bus_number = '137MS' AND s.stop_order = 5)
  OR   (b.bus_number = '137MS' AND s.stop_order = 6)
  OR   (b.bus_number = '137MS' AND s.stop_order = 7)
  OR   (b.bus_number = '137MS' AND s.stop_order = 8)
  OR   (b.bus_number = '137MS' AND s.stop_order = 9)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 6)
  OR   (b.bus_number = '137LB' AND s.stop_order = 7)
  OR   (b.bus_number = '137LB' AND s.stop_order = 8)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 6)
  OR   (b.bus_number = '137NS' AND s.stop_order = 7)
  OR   (b.bus_number = '137NS' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 6)
  OR   (b.bus_number = '137UD' AND s.stop_order = 7)
  OR   (b.bus_number = '137UD' AND s.stop_order = 8)
  OR   (b.bus_number = '137UD' AND s.stop_order = 9)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 6)
  OR   (b.bus_number = '137LB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 6)
  OR   (b.bus_number = '137AB' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137AL' AND s.stop_order = 0)
  OR   (b.bus_number = '137AL' AND s.stop_order = 1)
  OR   (b.bus_number = '137AL' AND s.stop_order = 2)
  OR   (b.bus_number = '137AL' AND s.stop_order = 3)
  OR   (b.bus_number = '137AL' AND s.stop_order = 4)
  OR   (b.bus_number = '137AL' AND s.stop_order = 5)
  OR   (b.bus_number = '137AL' AND s.stop_order = 6)
  OR   (b.bus_number = '137AL' AND s.stop_order = 7)
  OR   (b.bus_number = '137AC' AND s.stop_order = 0)
  OR   (b.bus_number = '137AC' AND s.stop_order = 1)
  OR   (b.bus_number = '137AC' AND s.stop_order = 2)
  OR   (b.bus_number = '137AC' AND s.stop_order = 3)
  OR   (b.bus_number = '137AC' AND s.stop_order = 4)
  OR   (b.bus_number = '137AC' AND s.stop_order = 5)
  OR   (b.bus_number = '137AC' AND s.stop_order = 6)
  OR   (b.bus_number = '137AC' AND s.stop_order = 7)
  OR   (b.bus_number = '137AC' AND s.stop_order = 8)
  OR   (b.bus_number = '137AC' AND s.stop_order = 9)
  OR   (b.bus_number = '335AC' AND s.stop_order = 0)
  OR   (b.bus_number = '335AC' AND s.stop_order = 1)
  OR   (b.bus_number = '335AC' AND s.stop_order = 2)
  OR   (b.bus_number = '335AC' AND s.stop_order = 3)
  OR   (b.bus_number = '335AC' AND s.stop_order = 4)
  OR   (b.bus_number = '335AC' AND s.stop_order = 5)
  OR   (b.bus_number = '335AC' AND s.stop_order = 6)
  OR   (b.bus_number = '335AC' AND s.stop_order = 7)
  OR   (b.bus_number = '335AC' AND s.stop_order = 8)
  OR   (b.bus_number = '160AC' AND s.stop_order = 0)
  OR   (b.bus_number = '160AC' AND s.stop_order = 1)
  OR   (b.bus_number = '160AC' AND s.stop_order = 2)
  OR   (b.bus_number = '160AC' AND s.stop_order = 3)
  OR   (b.bus_number = '160AC' AND s.stop_order = 4)
  OR   (b.bus_number = '160AC' AND s.stop_order = 5)
  OR   (b.bus_number = '160AC' AND s.stop_order = 6)
  OR   (b.bus_number = '160AC' AND s.stop_order = 7)
  OR   (b.bus_number = '160AC' AND s.stop_order = 8)
  OR   (b.bus_number = '160AC' AND s.stop_order = 9)
  OR   (b.bus_number = '160AC' AND s.stop_order = 10)
  OR   (b.bus_number = '160UD' AND s.stop_order = 0)
  OR   (b.bus_number = '160UD' AND s.stop_order = 1)
  OR   (b.bus_number = '160UD' AND s.stop_order = 2)
  OR   (b.bus_number = '160UD' AND s.stop_order = 3)
  OR   (b.bus_number = '160UD' AND s.stop_order = 4)
  OR   (b.bus_number = '160UD' AND s.stop_order = 5)
  OR   (b.bus_number = '160UD' AND s.stop_order = 6)
  OR   (b.bus_number = '160UD' AND s.stop_order = 7)
  OR   (b.bus_number = '757LB' AND s.stop_order = 0)
  OR   (b.bus_number = '757LB' AND s.stop_order = 1)
  OR   (b.bus_number = '757LB' AND s.stop_order = 2)
  OR   (b.bus_number = '757LB' AND s.stop_order = 3)
  OR   (b.bus_number = '757LB' AND s.stop_order = 4)
  OR   (b.bus_number = '757LB' AND s.stop_order = 5)
  OR   (b.bus_number = '757LB' AND s.stop_order = 6)
  OR   (b.bus_number = '757LB' AND s.stop_order = 7)
  OR   (b.bus_number = '757LB' AND s.stop_order = 8)
  OR   (b.bus_number = '172UD' AND s.stop_order = 0)
  OR   (b.bus_number = '172UD' AND s.stop_order = 1)
  OR   (b.bus_number = '172UD' AND s.stop_order = 2)
  OR   (b.bus_number = '172UD' AND s.stop_order = 3)
  OR   (b.bus_number = '172UD' AND s.stop_order = 4)
  OR   (b.bus_number = '172UD' AND s.stop_order = 5)
  OR   (b.bus_number = '172UD' AND s.stop_order = 6)
  OR   (b.bus_number = '172UD' AND s.stop_order = 7)
  OR   (b.bus_number = '172UD' AND s.stop_order = 8)
  OR   (b.bus_number = '172UD' AND s.stop_order = 9)
  OR   (b.bus_number = '164UD' AND s.stop_order = 0)
  OR   (b.bus_number = '164UD' AND s.stop_order = 1)
  OR   (b.bus_number = '164UD' AND s.stop_order = 2)
  OR   (b.bus_number = '164UD' AND s.stop_order = 3)
  OR   (b.bus_number = '164UD' AND s.stop_order = 4)
  OR   (b.bus_number = '164UD' AND s.stop_order = 5)
  OR   (b.bus_number = '164UD' AND s.stop_order = 6)
  OR   (b.bus_number = '164UD' AND s.stop_order = 7)
  OR   (b.bus_number = '164UD' AND s.stop_order = 8)
  OR   (b.bus_number = '163UD' AND s.stop_order = 0)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 0)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 5)
);

-- Chunk 2/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '163EUD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '163EUD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '160UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '160AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '163NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '160UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '164LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '164LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '164LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '164LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '164LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '164LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '164LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '164LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '164LB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '138UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '138UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '138UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '138UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '138UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '138UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '138UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '138UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '138UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '138UD' AND s.stop_order = 11 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '162UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '162UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '162UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '162UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '162UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '162UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '162UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '162UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '162UD' AND s.stop_order = 9 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '460NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460NS' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460NS' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460NS' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AC' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AC' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AC' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AC' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AC' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AC' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AC' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460UD' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460UD' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460UD' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460UD' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460UD' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460UD' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460UD' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460UD' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '785LB' AND s.stop_order = 1 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '785LB' AND s.stop_order = 2 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '785LB' AND s.stop_order = 3 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '785LB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 2 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 3 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 5 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 6 THEN 'CHROMEPET MTC BS'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 7 THEN 'VELACHERY'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 8 THEN 'SRP TOOLS'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 9 THEN 'CHENNAI TIRUVANMIYUR'
    WHEN b.bus_number = '460AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AC' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AC' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AC' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AC' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AC' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AC' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AC' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460MS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460MS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460MS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460MS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460MS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460MS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460MS' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460MS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460NS' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460NS' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460NS' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '791AB' AND s.stop_order = 0 THEN 'ERNAKULAM SOUTH KSRTC B.S'
    WHEN b.bus_number = '791AB' AND s.stop_order = 1 THEN 'ALWAYE BYPASS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 2 THEN 'ANGAMALI'
    WHEN b.bus_number = '791AB' AND s.stop_order = 3 THEN 'CHALAKUDI BYPASS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 4 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '791AB' AND s.stop_order = 5 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '791AB' AND s.stop_order = 6 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 7 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 8 THEN 'PEELAMEDU'
    WHEN b.bus_number = '791AB' AND s.stop_order = 9 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '791AB' AND s.stop_order = 10 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '791AB' AND s.stop_order = 11 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '791AB' AND s.stop_order = 12 THEN 'CHINNIYAMPALAYAM'
    WHEN b.bus_number = '791AB' AND s.stop_order = 13 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460LB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460LB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460LB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460LB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460LB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460LB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460LB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460LB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AL' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AL' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '460AL' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '460AL' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AL' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '460AL' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AL' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '460AL' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '962AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '962AC' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '962AC' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '962AC' AND s.stop_order = 5 THEN 'CHITT0OR'
    WHEN b.bus_number = '350A' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '457D' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '457B' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '457H' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '457J' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838NS' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838NS' AND s.stop_order = 9 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 10 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838NS' AND s.stop_order = 12 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838NS' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838NS' AND s.stop_order = 9 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 10 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838NS' AND s.stop_order = 12 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '457C' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '457A' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838NS' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838NS' AND s.stop_order = 9 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 10 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838NS' AND s.stop_order = 12 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '457F' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838NS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838NS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838NS' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838NS' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838NS' AND s.stop_order = 9 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838NS' AND s.stop_order = 10 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838NS' AND s.stop_order = 12 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838AB' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838AB' AND s.stop_order = 10 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '457G' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '729NS' AND s.stop_order = 0 THEN 'ERNAKULAM SOUTH KSRTC B.S'
    WHEN b.bus_number = '729NS' AND s.stop_order = 1 THEN 'ALWAYE BYPASS'
    WHEN b.bus_number = '729NS' AND s.stop_order = 2 THEN 'ANGAMALI'
    WHEN b.bus_number = '729NS' AND s.stop_order = 3 THEN 'CHALAKUDI BYPASS'
    WHEN b.bus_number = '729NS' AND s.stop_order = 4 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '729NS' AND s.stop_order = 5 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '729NS' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '149' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '724UD' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '770UD' AND s.stop_order = 0 THEN 'ERNAKULAM SOUTH KSRTC B.S'
    WHEN b.bus_number = '770UD' AND s.stop_order = 1 THEN 'ALWAYE BYPASS'
    WHEN b.bus_number = '770UD' AND s.stop_order = 2 THEN 'ANGAMALI'
    WHEN b.bus_number = '770UD' AND s.stop_order = 3 THEN 'CHALAKUDI BYPASS'
    WHEN b.bus_number = '770UD' AND s.stop_order = 4 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '770UD' AND s.stop_order = 5 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '770UD' AND s.stop_order = 6 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '770UD' AND s.stop_order = 7 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '290B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '40722' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '432MUD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '430NS' AND s.stop_order = 1 THEN 'LAKSHMI NAGER'
    WHEN b.bus_number = '430NS' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '470MS' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = '470MS' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 2 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = 'T470AB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '139C' AND s.stop_order = 0 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '139D' AND s.stop_order = 0 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '139B' AND s.stop_order = 0 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '282UD' AND s.stop_order = 1 THEN 'KOTTARAM'
    WHEN b.bus_number = '282UD' AND s.stop_order = 3 THEN 'VALLIYOOR'
    WHEN b.bus_number = '282UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '282UD' AND s.stop_order = 1 THEN 'KOTTARAM'
    WHEN b.bus_number = '282UD' AND s.stop_order = 3 THEN 'VALLIYOOR'
    WHEN b.bus_number = '282UD' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '888NS' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '888NS' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '561UD' AND s.stop_order = 1 THEN 'KOTTARAM'
    WHEN b.bus_number = '561UD' AND s.stop_order = 2 THEN 'SUSINDRUM'
    WHEN b.bus_number = '561UD' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 7 THEN 'VALLAKOTTAI (SRI VINAYAGA STOR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 8 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 9 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 10 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 11 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 12 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 13 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 7 THEN 'VALLAKOTTAI (SRI VINAYAGA STOR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 8 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 9 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 10 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 11 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 12 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KAC' AND s.stop_order = 13 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 7 THEN 'VALLAKOTTAI (SRI VINAYAGA STOR'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 8 THEN 'ORAGADAM JUNCTION (IOB)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 9 THEN 'PADAPPAI (JAMUNA JEWELERY)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 10 THEN 'MANIVAKKAM (INFRONT OF DARBAR)'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 11 THEN 'PERUNGALATHUR'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 12 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '831KUD' AND s.stop_order = 13 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AL' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AL' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AC' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AC' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '184RNS' AND s.stop_order = 2 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '184RNS' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '184RNS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '184RNS' AND s.stop_order = 6 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '184RNS' AND s.stop_order = 7 THEN 'CHENNAI AVADI'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 1 THEN 'KAYALPATTINAM'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 2 THEN 'ARUMUGANERI'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 3 THEN 'ATHUR(TNV)'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 4 THEN 'SPIC NAGAR'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '191TNS' AND s.stop_order = 9 THEN 'CHENNAI TIRUVOTRIYUR'
    WHEN b.bus_number = '137LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137LB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137LB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '184AB' AND s.stop_order = 2 THEN 'KADAYANALLUR'
    WHEN b.bus_number = '184AB' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '184AB' AND s.stop_order = 4 THEN 'VASUDEVANALLUR'
    WHEN b.bus_number = '184AB' AND s.stop_order = 5 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '184AB' AND s.stop_order = 6 THEN 'KRISHAN KOIL'
    WHEN b.bus_number = '184AB' AND s.stop_order = 7 THEN 'KALLUPATTI'
    WHEN b.bus_number = '184AB' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '184AB' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137MS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137MS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137MS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '185UD' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '185UD' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '143AB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '143AB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '143AB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '143AB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '143AB' AND s.stop_order = 6 THEN 'SATTUR'
    WHEN b.bus_number = '143AB' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '143AB' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '143AB' AND s.stop_order = 9 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '143AB' AND s.stop_order = 10 THEN 'CHENNAI TIRUVANMIYUR'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180LB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180LB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180LB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180LB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180LB' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '180LB' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '163EUD' AND s.stop_order = 6)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 7)
  OR   (b.bus_number = '163EUD' AND s.stop_order = 8)
  OR   (b.bus_number = '160UD' AND s.stop_order = 0)
  OR   (b.bus_number = '160AB' AND s.stop_order = 0)
  OR   (b.bus_number = '163NS' AND s.stop_order = 0)
  OR   (b.bus_number = '160UD' AND s.stop_order = 0)
  OR   (b.bus_number = '164LB' AND s.stop_order = 0)
  OR   (b.bus_number = '164LB' AND s.stop_order = 1)
  OR   (b.bus_number = '164LB' AND s.stop_order = 2)
  OR   (b.bus_number = '164LB' AND s.stop_order = 3)
  OR   (b.bus_number = '164LB' AND s.stop_order = 4)
  OR   (b.bus_number = '164LB' AND s.stop_order = 5)
  OR   (b.bus_number = '164LB' AND s.stop_order = 6)
  OR   (b.bus_number = '164LB' AND s.stop_order = 7)
  OR   (b.bus_number = '164LB' AND s.stop_order = 8)
  OR   (b.bus_number = '138UD' AND s.stop_order = 0)
  OR   (b.bus_number = '138UD' AND s.stop_order = 1)
  OR   (b.bus_number = '138UD' AND s.stop_order = 2)
  OR   (b.bus_number = '138UD' AND s.stop_order = 3)
  OR   (b.bus_number = '138UD' AND s.stop_order = 4)
  OR   (b.bus_number = '138UD' AND s.stop_order = 5)
  OR   (b.bus_number = '138UD' AND s.stop_order = 6)
  OR   (b.bus_number = '138UD' AND s.stop_order = 7)
  OR   (b.bus_number = '138UD' AND s.stop_order = 8)
  OR   (b.bus_number = '138UD' AND s.stop_order = 11)
  OR   (b.bus_number = '162UD' AND s.stop_order = 0)
  OR   (b.bus_number = '162UD' AND s.stop_order = 1)
  OR   (b.bus_number = '162UD' AND s.stop_order = 2)
  OR   (b.bus_number = '162UD' AND s.stop_order = 3)
  OR   (b.bus_number = '162UD' AND s.stop_order = 4)
  OR   (b.bus_number = '162UD' AND s.stop_order = 5)
  OR   (b.bus_number = '162UD' AND s.stop_order = 6)
  OR   (b.bus_number = '162UD' AND s.stop_order = 7)
  OR   (b.bus_number = '162UD' AND s.stop_order = 9)
  OR   (b.bus_number = '460NS' AND s.stop_order = 0)
  OR   (b.bus_number = '460NS' AND s.stop_order = 1)
  OR   (b.bus_number = '460NS' AND s.stop_order = 2)
  OR   (b.bus_number = '460NS' AND s.stop_order = 3)
  OR   (b.bus_number = '460NS' AND s.stop_order = 4)
  OR   (b.bus_number = '460NS' AND s.stop_order = 5)
  OR   (b.bus_number = '460NS' AND s.stop_order = 6)
  OR   (b.bus_number = '460NS' AND s.stop_order = 7)
  OR   (b.bus_number = '460NS' AND s.stop_order = 8)
  OR   (b.bus_number = '460NS' AND s.stop_order = 9)
  OR   (b.bus_number = '460NS' AND s.stop_order = 10)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 10)
  OR   (b.bus_number = '460AC' AND s.stop_order = 0)
  OR   (b.bus_number = '460AC' AND s.stop_order = 1)
  OR   (b.bus_number = '460AC' AND s.stop_order = 2)
  OR   (b.bus_number = '460AC' AND s.stop_order = 3)
  OR   (b.bus_number = '460AC' AND s.stop_order = 4)
  OR   (b.bus_number = '460AC' AND s.stop_order = 5)
  OR   (b.bus_number = '460AC' AND s.stop_order = 6)
  OR   (b.bus_number = '460AC' AND s.stop_order = 7)
  OR   (b.bus_number = '460UD' AND s.stop_order = 0)
  OR   (b.bus_number = '460UD' AND s.stop_order = 1)
  OR   (b.bus_number = '460UD' AND s.stop_order = 2)
  OR   (b.bus_number = '460UD' AND s.stop_order = 3)
  OR   (b.bus_number = '460UD' AND s.stop_order = 4)
  OR   (b.bus_number = '460UD' AND s.stop_order = 5)
  OR   (b.bus_number = '460UD' AND s.stop_order = 6)
  OR   (b.bus_number = '460UD' AND s.stop_order = 8)
  OR   (b.bus_number = '785LB' AND s.stop_order = 1)
  OR   (b.bus_number = '785LB' AND s.stop_order = 2)
  OR   (b.bus_number = '785LB' AND s.stop_order = 3)
  OR   (b.bus_number = '785LB' AND s.stop_order = 4)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 1)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 2)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 3)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 4)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 5)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 6)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 7)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 8)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AC' AND s.stop_order = 0)
  OR   (b.bus_number = '460AC' AND s.stop_order = 1)
  OR   (b.bus_number = '460AC' AND s.stop_order = 2)
  OR   (b.bus_number = '460AC' AND s.stop_order = 3)
  OR   (b.bus_number = '460AC' AND s.stop_order = 4)
  OR   (b.bus_number = '460AC' AND s.stop_order = 5)
  OR   (b.bus_number = '460AC' AND s.stop_order = 6)
  OR   (b.bus_number = '460AC' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 10)
  OR   (b.bus_number = '460MS' AND s.stop_order = 0)
  OR   (b.bus_number = '460MS' AND s.stop_order = 1)
  OR   (b.bus_number = '460MS' AND s.stop_order = 2)
  OR   (b.bus_number = '460MS' AND s.stop_order = 3)
  OR   (b.bus_number = '460MS' AND s.stop_order = 4)
  OR   (b.bus_number = '460MS' AND s.stop_order = 5)
  OR   (b.bus_number = '460MS' AND s.stop_order = 6)
  OR   (b.bus_number = '460MS' AND s.stop_order = 7)
  OR   (b.bus_number = '460NS' AND s.stop_order = 0)
  OR   (b.bus_number = '460NS' AND s.stop_order = 1)
  OR   (b.bus_number = '460NS' AND s.stop_order = 2)
  OR   (b.bus_number = '460NS' AND s.stop_order = 3)
  OR   (b.bus_number = '460NS' AND s.stop_order = 4)
  OR   (b.bus_number = '460NS' AND s.stop_order = 5)
  OR   (b.bus_number = '460NS' AND s.stop_order = 6)
  OR   (b.bus_number = '460NS' AND s.stop_order = 7)
  OR   (b.bus_number = '460NS' AND s.stop_order = 8)
  OR   (b.bus_number = '460NS' AND s.stop_order = 9)
  OR   (b.bus_number = '460NS' AND s.stop_order = 10)
  OR   (b.bus_number = '791AB' AND s.stop_order = 0)
  OR   (b.bus_number = '791AB' AND s.stop_order = 1)
  OR   (b.bus_number = '791AB' AND s.stop_order = 2)
  OR   (b.bus_number = '791AB' AND s.stop_order = 3)
  OR   (b.bus_number = '791AB' AND s.stop_order = 4)
  OR   (b.bus_number = '791AB' AND s.stop_order = 5)
  OR   (b.bus_number = '791AB' AND s.stop_order = 6)
  OR   (b.bus_number = '791AB' AND s.stop_order = 7)
  OR   (b.bus_number = '791AB' AND s.stop_order = 8)
  OR   (b.bus_number = '791AB' AND s.stop_order = 9)
  OR   (b.bus_number = '791AB' AND s.stop_order = 10)
  OR   (b.bus_number = '791AB' AND s.stop_order = 11)
  OR   (b.bus_number = '791AB' AND s.stop_order = 12)
  OR   (b.bus_number = '791AB' AND s.stop_order = 13)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 10)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 10)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460LB' AND s.stop_order = 0)
  OR   (b.bus_number = '460LB' AND s.stop_order = 1)
  OR   (b.bus_number = '460LB' AND s.stop_order = 2)
  OR   (b.bus_number = '460LB' AND s.stop_order = 3)
  OR   (b.bus_number = '460LB' AND s.stop_order = 4)
  OR   (b.bus_number = '460LB' AND s.stop_order = 5)
  OR   (b.bus_number = '460LB' AND s.stop_order = 6)
  OR   (b.bus_number = '460LB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AL' AND s.stop_order = 0)
  OR   (b.bus_number = '460AL' AND s.stop_order = 1)
  OR   (b.bus_number = '460AL' AND s.stop_order = 2)
  OR   (b.bus_number = '460AL' AND s.stop_order = 3)
  OR   (b.bus_number = '460AL' AND s.stop_order = 4)
  OR   (b.bus_number = '460AL' AND s.stop_order = 5)
  OR   (b.bus_number = '460AL' AND s.stop_order = 6)
  OR   (b.bus_number = '460AL' AND s.stop_order = 7)
  OR   (b.bus_number = '962AC' AND s.stop_order = 0)
  OR   (b.bus_number = '962AC' AND s.stop_order = 1)
  OR   (b.bus_number = '962AC' AND s.stop_order = 2)
  OR   (b.bus_number = '962AC' AND s.stop_order = 5)
  OR   (b.bus_number = '350A' AND s.stop_order = 0)
  OR   (b.bus_number = '457D' AND s.stop_order = 0)
  OR   (b.bus_number = '457B' AND s.stop_order = 0)
  OR   (b.bus_number = '457H' AND s.stop_order = 0)
  OR   (b.bus_number = '457J' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 1)
  OR   (b.bus_number = '838NS' AND s.stop_order = 2)
  OR   (b.bus_number = '838NS' AND s.stop_order = 3)
  OR   (b.bus_number = '838NS' AND s.stop_order = 4)
  OR   (b.bus_number = '838NS' AND s.stop_order = 5)
  OR   (b.bus_number = '838NS' AND s.stop_order = 6)
  OR   (b.bus_number = '838NS' AND s.stop_order = 7)
  OR   (b.bus_number = '838NS' AND s.stop_order = 8)
  OR   (b.bus_number = '838NS' AND s.stop_order = 9)
  OR   (b.bus_number = '838NS' AND s.stop_order = 10)
  OR   (b.bus_number = '838NS' AND s.stop_order = 12)
  OR   (b.bus_number = '838NS' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 1)
  OR   (b.bus_number = '838NS' AND s.stop_order = 2)
  OR   (b.bus_number = '838NS' AND s.stop_order = 3)
  OR   (b.bus_number = '838NS' AND s.stop_order = 4)
  OR   (b.bus_number = '838NS' AND s.stop_order = 5)
  OR   (b.bus_number = '838NS' AND s.stop_order = 6)
  OR   (b.bus_number = '838NS' AND s.stop_order = 7)
  OR   (b.bus_number = '838NS' AND s.stop_order = 8)
  OR   (b.bus_number = '838NS' AND s.stop_order = 9)
  OR   (b.bus_number = '838NS' AND s.stop_order = 10)
  OR   (b.bus_number = '838NS' AND s.stop_order = 12)
  OR   (b.bus_number = '457C' AND s.stop_order = 0)
  OR   (b.bus_number = '457A' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 1)
  OR   (b.bus_number = '838NS' AND s.stop_order = 2)
  OR   (b.bus_number = '838NS' AND s.stop_order = 3)
  OR   (b.bus_number = '838NS' AND s.stop_order = 4)
  OR   (b.bus_number = '838NS' AND s.stop_order = 5)
  OR   (b.bus_number = '838NS' AND s.stop_order = 6)
  OR   (b.bus_number = '838NS' AND s.stop_order = 7)
  OR   (b.bus_number = '838NS' AND s.stop_order = 8)
  OR   (b.bus_number = '838NS' AND s.stop_order = 9)
  OR   (b.bus_number = '838NS' AND s.stop_order = 10)
  OR   (b.bus_number = '838NS' AND s.stop_order = 12)
  OR   (b.bus_number = '457F' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 0)
  OR   (b.bus_number = '838NS' AND s.stop_order = 1)
  OR   (b.bus_number = '838NS' AND s.stop_order = 2)
  OR   (b.bus_number = '838NS' AND s.stop_order = 3)
  OR   (b.bus_number = '838NS' AND s.stop_order = 4)
  OR   (b.bus_number = '838NS' AND s.stop_order = 5)
  OR   (b.bus_number = '838NS' AND s.stop_order = 6)
  OR   (b.bus_number = '838NS' AND s.stop_order = 7)
  OR   (b.bus_number = '838NS' AND s.stop_order = 8)
  OR   (b.bus_number = '838NS' AND s.stop_order = 9)
  OR   (b.bus_number = '838NS' AND s.stop_order = 10)
  OR   (b.bus_number = '838NS' AND s.stop_order = 12)
  OR   (b.bus_number = '838AB' AND s.stop_order = 0)
  OR   (b.bus_number = '838AB' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 2)
  OR   (b.bus_number = '838AB' AND s.stop_order = 3)
  OR   (b.bus_number = '838AB' AND s.stop_order = 4)
  OR   (b.bus_number = '838AB' AND s.stop_order = 5)
  OR   (b.bus_number = '838AB' AND s.stop_order = 6)
  OR   (b.bus_number = '838AB' AND s.stop_order = 7)
  OR   (b.bus_number = '838AB' AND s.stop_order = 8)
  OR   (b.bus_number = '838AB' AND s.stop_order = 10)
  OR   (b.bus_number = '457G' AND s.stop_order = 0)
  OR   (b.bus_number = '729NS' AND s.stop_order = 0)
  OR   (b.bus_number = '729NS' AND s.stop_order = 1)
  OR   (b.bus_number = '729NS' AND s.stop_order = 2)
  OR   (b.bus_number = '729NS' AND s.stop_order = 3)
  OR   (b.bus_number = '729NS' AND s.stop_order = 4)
  OR   (b.bus_number = '729NS' AND s.stop_order = 5)
  OR   (b.bus_number = '729NS' AND s.stop_order = 8)
  OR   (b.bus_number = '149' AND s.stop_order = 0)
  OR   (b.bus_number = '724UD' AND s.stop_order = 1)
  OR   (b.bus_number = '770UD' AND s.stop_order = 0)
  OR   (b.bus_number = '770UD' AND s.stop_order = 1)
  OR   (b.bus_number = '770UD' AND s.stop_order = 2)
  OR   (b.bus_number = '770UD' AND s.stop_order = 3)
  OR   (b.bus_number = '770UD' AND s.stop_order = 4)
  OR   (b.bus_number = '770UD' AND s.stop_order = 5)
  OR   (b.bus_number = '770UD' AND s.stop_order = 6)
  OR   (b.bus_number = '770UD' AND s.stop_order = 7)
  OR   (b.bus_number = '290B' AND s.stop_order = 1)
  OR   (b.bus_number = '40722' AND s.stop_order = 2)
  OR   (b.bus_number = '432MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '430NS' AND s.stop_order = 1)
  OR   (b.bus_number = '430NS' AND s.stop_order = 2)
  OR   (b.bus_number = '470MS' AND s.stop_order = 0)
  OR   (b.bus_number = '470MS' AND s.stop_order = 2)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 2)
  OR   (b.bus_number = 'T470AB' AND s.stop_order = 4)
  OR   (b.bus_number = '139C' AND s.stop_order = 0)
  OR   (b.bus_number = '139D' AND s.stop_order = 0)
  OR   (b.bus_number = '139B' AND s.stop_order = 0)
  OR   (b.bus_number = '282UD' AND s.stop_order = 1)
  OR   (b.bus_number = '282UD' AND s.stop_order = 3)
  OR   (b.bus_number = '282UD' AND s.stop_order = 6)
  OR   (b.bus_number = '282UD' AND s.stop_order = 1)
  OR   (b.bus_number = '282UD' AND s.stop_order = 3)
  OR   (b.bus_number = '282UD' AND s.stop_order = 7)
  OR   (b.bus_number = '888NS' AND s.stop_order = 2)
  OR   (b.bus_number = '888NS' AND s.stop_order = 6)
  OR   (b.bus_number = '561UD' AND s.stop_order = 1)
  OR   (b.bus_number = '561UD' AND s.stop_order = 2)
  OR   (b.bus_number = '561UD' AND s.stop_order = 4)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 1)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 2)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 3)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 7)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 8)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 9)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 10)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 11)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 12)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 13)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 0)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 1)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 2)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 3)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 7)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 8)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 9)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 10)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 11)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 12)
  OR   (b.bus_number = '831KAC' AND s.stop_order = 13)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 0)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 2)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 7)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 8)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 9)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 10)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 11)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 12)
  OR   (b.bus_number = '831KUD' AND s.stop_order = 13)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137AL' AND s.stop_order = 0)
  OR   (b.bus_number = '137AL' AND s.stop_order = 1)
  OR   (b.bus_number = '137AL' AND s.stop_order = 2)
  OR   (b.bus_number = '137AL' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AC' AND s.stop_order = 0)
  OR   (b.bus_number = '137AC' AND s.stop_order = 1)
  OR   (b.bus_number = '137AC' AND s.stop_order = 2)
  OR   (b.bus_number = '137AC' AND s.stop_order = 3)
  OR   (b.bus_number = '137AC' AND s.stop_order = 4)
  OR   (b.bus_number = '137AC' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '184RNS' AND s.stop_order = 2)
  OR   (b.bus_number = '184RNS' AND s.stop_order = 4)
  OR   (b.bus_number = '184RNS' AND s.stop_order = 5)
  OR   (b.bus_number = '184RNS' AND s.stop_order = 6)
  OR   (b.bus_number = '184RNS' AND s.stop_order = 7)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 1)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 2)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 3)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 4)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 7)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 8)
  OR   (b.bus_number = '191TNS' AND s.stop_order = 9)
  OR   (b.bus_number = '137LB' AND s.stop_order = 0)
  OR   (b.bus_number = '137LB' AND s.stop_order = 1)
  OR   (b.bus_number = '137LB' AND s.stop_order = 2)
  OR   (b.bus_number = '137LB' AND s.stop_order = 3)
  OR   (b.bus_number = '137LB' AND s.stop_order = 4)
  OR   (b.bus_number = '137LB' AND s.stop_order = 5)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '184AB' AND s.stop_order = 2)
  OR   (b.bus_number = '184AB' AND s.stop_order = 3)
  OR   (b.bus_number = '184AB' AND s.stop_order = 4)
  OR   (b.bus_number = '184AB' AND s.stop_order = 5)
  OR   (b.bus_number = '184AB' AND s.stop_order = 6)
  OR   (b.bus_number = '184AB' AND s.stop_order = 7)
  OR   (b.bus_number = '184AB' AND s.stop_order = 8)
  OR   (b.bus_number = '184AB' AND s.stop_order = 9)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137AB' AND s.stop_order = 5)
  OR   (b.bus_number = '137MS' AND s.stop_order = 0)
  OR   (b.bus_number = '137MS' AND s.stop_order = 1)
  OR   (b.bus_number = '137MS' AND s.stop_order = 2)
  OR   (b.bus_number = '137MS' AND s.stop_order = 3)
  OR   (b.bus_number = '137MS' AND s.stop_order = 4)
  OR   (b.bus_number = '137MS' AND s.stop_order = 5)
  OR   (b.bus_number = '185UD' AND s.stop_order = 3)
  OR   (b.bus_number = '185UD' AND s.stop_order = 4)
  OR   (b.bus_number = '143AB' AND s.stop_order = 1)
  OR   (b.bus_number = '143AB' AND s.stop_order = 2)
  OR   (b.bus_number = '143AB' AND s.stop_order = 3)
  OR   (b.bus_number = '143AB' AND s.stop_order = 4)
  OR   (b.bus_number = '143AB' AND s.stop_order = 6)
  OR   (b.bus_number = '143AB' AND s.stop_order = 7)
  OR   (b.bus_number = '143AB' AND s.stop_order = 8)
  OR   (b.bus_number = '143AB' AND s.stop_order = 9)
  OR   (b.bus_number = '143AB' AND s.stop_order = 10)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180LB' AND s.stop_order = 1)
  OR   (b.bus_number = '180LB' AND s.stop_order = 2)
  OR   (b.bus_number = '180LB' AND s.stop_order = 3)
  OR   (b.bus_number = '180LB' AND s.stop_order = 4)
  OR   (b.bus_number = '180LB' AND s.stop_order = 6)
  OR   (b.bus_number = '180LB' AND s.stop_order = 8)
);

-- Chunk 3/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '180LB' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AB' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137NS' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137UD' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '184AB' AND s.stop_order = 2 THEN 'KADAYANALLUR'
    WHEN b.bus_number = '184AB' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '184AB' AND s.stop_order = 4 THEN 'VASUDEVANALLUR'
    WHEN b.bus_number = '184AB' AND s.stop_order = 5 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '184AB' AND s.stop_order = 6 THEN 'KRISHAN KOIL'
    WHEN b.bus_number = '184AB' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '184AB' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AL' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AL' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AL' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '170NB' AND s.stop_order = 1 THEN 'KELAERAL'
    WHEN b.bus_number = '170NB' AND s.stop_order = 2 THEN 'ARUPPUKOTTAI'
    WHEN b.bus_number = '170NB' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '170NB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '184UD' AND s.stop_order = 2 THEN 'KADAYANALLUR'
    WHEN b.bus_number = '184UD' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '184UD' AND s.stop_order = 4 THEN 'VASUDEVANALLUR'
    WHEN b.bus_number = '184UD' AND s.stop_order = 5 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '184UD' AND s.stop_order = 6 THEN 'KRISHAN KOIL'
    WHEN b.bus_number = '184UD' AND s.stop_order = 7 THEN 'KALLUPATTI'
    WHEN b.bus_number = '184UD' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '184UD' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '137AC' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 1 THEN 'OTTHAKADAI  BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 2 THEN 'CHITTAMPATTI TOLL'
    WHEN b.bus_number = '137AC' AND s.stop_order = 3 THEN 'MELUR BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 4 THEN 'KARUNGALAKUDI BYE PASS'
    WHEN b.bus_number = '137AC' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '897LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 2 THEN 'DINDIGUL PALANI BYPASS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 3 THEN 'VEDASENDUR BYPASS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 12 THEN 'MERCARA'
    WHEN b.bus_number = '1054A' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '480E' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '111P' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846UD' AND s.stop_order = 3 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846UD' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846UD' AND s.stop_order = 3 THEN 'SAMAYANALLUR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 4 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846UD' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '480A' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 4 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 4 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846LB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846LB' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846LB' AND s.stop_order = 4 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 3 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846UD' AND s.stop_order = 3 THEN 'SAMAYANALLUR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 4 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846UD' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874AB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '874AB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '874AB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '874AB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874AB' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '874AB' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846UD' AND s.stop_order = 2 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846NS' AND s.stop_order = 3 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846NS' AND s.stop_order = 5 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '887AB' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '887AB' AND s.stop_order = 1 THEN 'VALLIYOOR'
    WHEN b.bus_number = '887AB' AND s.stop_order = 3 THEN 'KOVILPATTI NEW BS'
    WHEN b.bus_number = '887AB' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '887AB' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846NS' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846NS' AND s.stop_order = 3 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846NS' AND s.stop_order = 5 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874UD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '874UD' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '874UD' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '874UD' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874UD' AND s.stop_order = 5 THEN 'KOVILPATTI BYPASS BS'
    WHEN b.bus_number = '874UD' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '874UD' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '874UD' AND s.stop_order = 8 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '874UD' AND s.stop_order = 11 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874AL' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '874AL' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '874AL' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '874AL' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874AL' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '874AL' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '373' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '373B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '320' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '321A' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '777UD' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '777UD' AND s.stop_order = 4 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '777UD' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '198UD' AND s.stop_order = 1 THEN 'THOVALAI'
    WHEN b.bus_number = '198UD' AND s.stop_order = 2 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198UD' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198AB' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198AB' AND s.stop_order = 2 THEN 'THOVALAI'
    WHEN b.bus_number = '198AB' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198AB' AND s.stop_order = 4 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198AB' AND s.stop_order = 6 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '198AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 1 THEN 'MULAGUMOODU'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 2 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '287UD' AND s.stop_order = 1 THEN 'THIRUVATTAR'
    WHEN b.bus_number = '287UD' AND s.stop_order = 2 THEN 'VERKILAMBI'
    WHEN b.bus_number = '287UD' AND s.stop_order = 3 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '287UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284UD' AND s.stop_order = 1 THEN 'MULAGUMOODU'
    WHEN b.bus_number = '284UD' AND s.stop_order = 2 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '284UD' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '284UD' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '284UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284AB' AND s.stop_order = 1 THEN 'SIRAYANKULI'
    WHEN b.bus_number = '284AB' AND s.stop_order = 2 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '284AB' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '284AB' AND s.stop_order = 5 THEN 'THOVALAI'
    WHEN b.bus_number = '284AB' AND s.stop_order = 6 THEN 'VELLAMADAM'
    WHEN b.bus_number = '284AB' AND s.stop_order = 7 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '284AB' AND s.stop_order = 8 THEN 'KAVALKINARU'
    WHEN b.bus_number = '284AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284NS' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '284NS' AND s.stop_order = 3 THEN 'VELLAMADAM'
    WHEN b.bus_number = '284NS' AND s.stop_order = 4 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '284NS' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '284NS' AND s.stop_order = 6 THEN 'NANGUNERI TOLL'
    WHEN b.bus_number = '284NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198UD' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '198UD' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198UD' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198UD' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198UD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198AB' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198AB' AND s.stop_order = 2 THEN 'THOVALAI'
    WHEN b.bus_number = '198AB' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198AB' AND s.stop_order = 4 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198AB' AND s.stop_order = 6 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '198AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198MS' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198MS' AND s.stop_order = 2 THEN 'THOVALAI'
    WHEN b.bus_number = '198MS' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198MS' AND s.stop_order = 4 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198MS' AND s.stop_order = 6 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '198MS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198LB' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198LB' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198LB' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198LB' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '198LB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '794UD' AND s.stop_order = 1 THEN 'NEYYANTIKARAI'
    WHEN b.bus_number = '794UD' AND s.stop_order = 2 THEN 'KALIAKAVILAI'
    WHEN b.bus_number = '794UD' AND s.stop_order = 4 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '794UD' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284UD' AND s.stop_order = 1 THEN 'MULAGUMOODU'
    WHEN b.bus_number = '284UD' AND s.stop_order = 2 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '284UD' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '284UD' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '284UD' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198UD' AND s.stop_order = 1 THEN 'THOVALAI'
    WHEN b.bus_number = '198UD' AND s.stop_order = 2 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198UD' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'VELLAMADAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'KAVALKINARU'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '892NS' AND s.stop_order = 1 THEN 'KARUNGAL'
    WHEN b.bus_number = '892NS' AND s.stop_order = 2 THEN 'COLACHAL'
    WHEN b.bus_number = '892NS' AND s.stop_order = 3 THEN 'THINGALNAGAR'
    WHEN b.bus_number = '892NS' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '892NS' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '687UD' AND s.stop_order = 1 THEN 'NEYYANTIKARAI'
    WHEN b.bus_number = '687UD' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '687UD' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '687UD' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '887NS' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '887NS' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '887NS' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '887NS' AND s.stop_order = 4 THEN 'KRISHNAGIRI TOLL PLAZA'
    WHEN b.bus_number = '887NS' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '887UD' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '887UD' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '887UD' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '887UD' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '892UD' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '892UD' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '560EUD' AND s.stop_order = 1 THEN 'MULAGUMOODU'
    WHEN b.bus_number = '560EUD' AND s.stop_order = 2 THEN 'AZHAHIYA MANDAPAM'
    WHEN b.bus_number = '560EUD' AND s.stop_order = 3 THEN 'THUCKKALAY'
    WHEN b.bus_number = '560EUD' AND s.stop_order = 5 THEN 'VALLIYOOR'
    WHEN b.bus_number = '560EUD' AND s.stop_order = 7 THEN 'TUTI CORIN'
    WHEN b.bus_number = '771EUD' AND s.stop_order = 1 THEN 'NEYYANTIKARAI'
    WHEN b.bus_number = '771EUD' AND s.stop_order = 2 THEN 'KALIAKAVILAI'
    WHEN b.bus_number = '560CUD' AND s.stop_order = 1 THEN 'KARUNGAL'
    WHEN b.bus_number = '560CUD' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '531VUD' AND s.stop_order = 4 THEN 'THANJAVUR NEW BS'
    WHEN b.bus_number = '42901' AND s.stop_order = 1 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '669UD' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '669UD' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '669UD' AND s.stop_order = 6 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '669UD' AND s.stop_order = 7 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 5 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '42902' AND s.stop_order = 1 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '510C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '120UD' AND s.stop_order = 0 THEN 'THURAIYUR'
    WHEN b.bus_number = '120UD' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '845UD' AND s.stop_order = 4 THEN 'ATTUR (SALEM)'
    WHEN b.bus_number = '845UD' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '133AC' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '144UD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '126NS' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '145EUD' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133AC' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133UD' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '857NS' AND s.stop_order = 4 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '531VUD' AND s.stop_order = 3 THEN 'THANJAVUR NEW BS'
    WHEN b.bus_number = '531VUD' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '175M' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175N' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281M' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AF' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281Y' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281Z' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AY' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175O' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175V' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '250A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AN' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281I' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '213A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281P' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175Q' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '275A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AO' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AH' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175E' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AL' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AL' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AL' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AL' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AC' AND s.stop_order = 1 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AC' AND s.stop_order = 2 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AC' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '775A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422MS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422MS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422MS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422MS' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '375A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AS' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AX' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AB' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AV' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AC' AND s.stop_order = 1 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AC' AND s.stop_order = 2 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AC' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AU' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AG' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175U' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '975B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281K' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AJ' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281L' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281E' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AI' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281H' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AE' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281J' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175G' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '275B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '375B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175S' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AP' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281N' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'METTUPATTI TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'ATHUR BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'THALAIVASAL TOLLGATE'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281G' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281S' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AC' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AK' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'KONDALAMPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SEELANAICKENPATTI BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'AYOTHIYAPATTINAM BYE PASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281X' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AQ' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '874HUD' AND s.stop_order = 1 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '353B' AND s.stop_order = 1 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '353B' AND s.stop_order = 1 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180UD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180UD' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180UD' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180UD' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180UD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180UD' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180UD' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180UD' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180UD' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'KOVILPATTI'
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '194UD' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 2 THEN 'VEERAVANALLUR PC BYPASS'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'KOVILPATTI'
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180MS' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180MS' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180MS' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180MS' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180MS' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '180MS' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '180MS' AND s.stop_order = 8 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AS' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180AS' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180AS' AND s.stop_order = 3 THEN 'TIRUNELVELI OLD BS'
    WHEN b.bus_number = '180AS' AND s.stop_order = 4 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180AS' AND s.stop_order = 5 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180AS' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'KOVILPATTI'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '180LB' AND s.stop_order = 9)
  OR   (b.bus_number = '137AB' AND s.stop_order = 0)
  OR   (b.bus_number = '137AB' AND s.stop_order = 1)
  OR   (b.bus_number = '137AB' AND s.stop_order = 2)
  OR   (b.bus_number = '137AB' AND s.stop_order = 3)
  OR   (b.bus_number = '137AB' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 0)
  OR   (b.bus_number = '137NS' AND s.stop_order = 1)
  OR   (b.bus_number = '137NS' AND s.stop_order = 2)
  OR   (b.bus_number = '137NS' AND s.stop_order = 3)
  OR   (b.bus_number = '137NS' AND s.stop_order = 4)
  OR   (b.bus_number = '137NS' AND s.stop_order = 5)
  OR   (b.bus_number = '137UD' AND s.stop_order = 0)
  OR   (b.bus_number = '137UD' AND s.stop_order = 1)
  OR   (b.bus_number = '137UD' AND s.stop_order = 2)
  OR   (b.bus_number = '137UD' AND s.stop_order = 3)
  OR   (b.bus_number = '137UD' AND s.stop_order = 4)
  OR   (b.bus_number = '137UD' AND s.stop_order = 5)
  OR   (b.bus_number = '184AB' AND s.stop_order = 2)
  OR   (b.bus_number = '184AB' AND s.stop_order = 3)
  OR   (b.bus_number = '184AB' AND s.stop_order = 4)
  OR   (b.bus_number = '184AB' AND s.stop_order = 5)
  OR   (b.bus_number = '184AB' AND s.stop_order = 6)
  OR   (b.bus_number = '184AB' AND s.stop_order = 7)
  OR   (b.bus_number = '184AB' AND s.stop_order = 8)
  OR   (b.bus_number = '137AL' AND s.stop_order = 0)
  OR   (b.bus_number = '137AL' AND s.stop_order = 1)
  OR   (b.bus_number = '137AL' AND s.stop_order = 2)
  OR   (b.bus_number = '137AL' AND s.stop_order = 3)
  OR   (b.bus_number = '170NB' AND s.stop_order = 1)
  OR   (b.bus_number = '170NB' AND s.stop_order = 2)
  OR   (b.bus_number = '170NB' AND s.stop_order = 3)
  OR   (b.bus_number = '170NB' AND s.stop_order = 4)
  OR   (b.bus_number = '184UD' AND s.stop_order = 2)
  OR   (b.bus_number = '184UD' AND s.stop_order = 3)
  OR   (b.bus_number = '184UD' AND s.stop_order = 4)
  OR   (b.bus_number = '184UD' AND s.stop_order = 5)
  OR   (b.bus_number = '184UD' AND s.stop_order = 6)
  OR   (b.bus_number = '184UD' AND s.stop_order = 7)
  OR   (b.bus_number = '184UD' AND s.stop_order = 8)
  OR   (b.bus_number = '184UD' AND s.stop_order = 9)
  OR   (b.bus_number = '137AC' AND s.stop_order = 0)
  OR   (b.bus_number = '137AC' AND s.stop_order = 1)
  OR   (b.bus_number = '137AC' AND s.stop_order = 2)
  OR   (b.bus_number = '137AC' AND s.stop_order = 3)
  OR   (b.bus_number = '137AC' AND s.stop_order = 4)
  OR   (b.bus_number = '137AC' AND s.stop_order = 5)
  OR   (b.bus_number = '897LB' AND s.stop_order = 0)
  OR   (b.bus_number = '897LB' AND s.stop_order = 1)
  OR   (b.bus_number = '897LB' AND s.stop_order = 2)
  OR   (b.bus_number = '897LB' AND s.stop_order = 3)
  OR   (b.bus_number = '897LB' AND s.stop_order = 12)
  OR   (b.bus_number = '1054A' AND s.stop_order = 0)
  OR   (b.bus_number = '480E' AND s.stop_order = 0)
  OR   (b.bus_number = '111P' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 1)
  OR   (b.bus_number = '846UD' AND s.stop_order = 2)
  OR   (b.bus_number = '846UD' AND s.stop_order = 3)
  OR   (b.bus_number = '846UD' AND s.stop_order = 6)
  OR   (b.bus_number = '846UD' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 1)
  OR   (b.bus_number = '846UD' AND s.stop_order = 2)
  OR   (b.bus_number = '846UD' AND s.stop_order = 3)
  OR   (b.bus_number = '846UD' AND s.stop_order = 4)
  OR   (b.bus_number = '846UD' AND s.stop_order = 7)
  OR   (b.bus_number = '480A' AND s.stop_order = 0)
  OR   (b.bus_number = '846NS' AND s.stop_order = 0)
  OR   (b.bus_number = '846NS' AND s.stop_order = 1)
  OR   (b.bus_number = '846NS' AND s.stop_order = 4)
  OR   (b.bus_number = '846NS' AND s.stop_order = 0)
  OR   (b.bus_number = '846NS' AND s.stop_order = 1)
  OR   (b.bus_number = '846NS' AND s.stop_order = 4)
  OR   (b.bus_number = '846LB' AND s.stop_order = 0)
  OR   (b.bus_number = '846LB' AND s.stop_order = 1)
  OR   (b.bus_number = '846LB' AND s.stop_order = 4)
  OR   (b.bus_number = '846UD' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 1)
  OR   (b.bus_number = '846UD' AND s.stop_order = 3)
  OR   (b.bus_number = '846UD' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 1)
  OR   (b.bus_number = '846UD' AND s.stop_order = 2)
  OR   (b.bus_number = '846UD' AND s.stop_order = 3)
  OR   (b.bus_number = '846UD' AND s.stop_order = 4)
  OR   (b.bus_number = '846UD' AND s.stop_order = 6)
  OR   (b.bus_number = '874AB' AND s.stop_order = 1)
  OR   (b.bus_number = '874AB' AND s.stop_order = 2)
  OR   (b.bus_number = '874AB' AND s.stop_order = 3)
  OR   (b.bus_number = '874AB' AND s.stop_order = 4)
  OR   (b.bus_number = '874AB' AND s.stop_order = 6)
  OR   (b.bus_number = '874AB' AND s.stop_order = 8)
  OR   (b.bus_number = '846UD' AND s.stop_order = 0)
  OR   (b.bus_number = '846UD' AND s.stop_order = 2)
  OR   (b.bus_number = '846NS' AND s.stop_order = 0)
  OR   (b.bus_number = '846NS' AND s.stop_order = 1)
  OR   (b.bus_number = '846NS' AND s.stop_order = 2)
  OR   (b.bus_number = '846NS' AND s.stop_order = 3)
  OR   (b.bus_number = '846NS' AND s.stop_order = 5)
  OR   (b.bus_number = '887AB' AND s.stop_order = 0)
  OR   (b.bus_number = '887AB' AND s.stop_order = 1)
  OR   (b.bus_number = '887AB' AND s.stop_order = 3)
  OR   (b.bus_number = '887AB' AND s.stop_order = 4)
  OR   (b.bus_number = '887AB' AND s.stop_order = 7)
  OR   (b.bus_number = '846NS' AND s.stop_order = 0)
  OR   (b.bus_number = '846NS' AND s.stop_order = 1)
  OR   (b.bus_number = '846NS' AND s.stop_order = 2)
  OR   (b.bus_number = '846NS' AND s.stop_order = 3)
  OR   (b.bus_number = '846NS' AND s.stop_order = 5)
  OR   (b.bus_number = '874UD' AND s.stop_order = 1)
  OR   (b.bus_number = '874UD' AND s.stop_order = 2)
  OR   (b.bus_number = '874UD' AND s.stop_order = 3)
  OR   (b.bus_number = '874UD' AND s.stop_order = 4)
  OR   (b.bus_number = '874UD' AND s.stop_order = 5)
  OR   (b.bus_number = '874UD' AND s.stop_order = 6)
  OR   (b.bus_number = '874UD' AND s.stop_order = 7)
  OR   (b.bus_number = '874UD' AND s.stop_order = 8)
  OR   (b.bus_number = '874UD' AND s.stop_order = 11)
  OR   (b.bus_number = '874AL' AND s.stop_order = 1)
  OR   (b.bus_number = '874AL' AND s.stop_order = 2)
  OR   (b.bus_number = '874AL' AND s.stop_order = 3)
  OR   (b.bus_number = '874AL' AND s.stop_order = 4)
  OR   (b.bus_number = '874AL' AND s.stop_order = 6)
  OR   (b.bus_number = '874AL' AND s.stop_order = 8)
  OR   (b.bus_number = '373' AND s.stop_order = 0)
  OR   (b.bus_number = '373B' AND s.stop_order = 0)
  OR   (b.bus_number = '320' AND s.stop_order = 0)
  OR   (b.bus_number = '321A' AND s.stop_order = 0)
  OR   (b.bus_number = '777UD' AND s.stop_order = 3)
  OR   (b.bus_number = '777UD' AND s.stop_order = 4)
  OR   (b.bus_number = '777UD' AND s.stop_order = 6)
  OR   (b.bus_number = '198UD' AND s.stop_order = 1)
  OR   (b.bus_number = '198UD' AND s.stop_order = 2)
  OR   (b.bus_number = '198UD' AND s.stop_order = 3)
  OR   (b.bus_number = '198UD' AND s.stop_order = 6)
  OR   (b.bus_number = '198AB' AND s.stop_order = 1)
  OR   (b.bus_number = '198AB' AND s.stop_order = 2)
  OR   (b.bus_number = '198AB' AND s.stop_order = 3)
  OR   (b.bus_number = '198AB' AND s.stop_order = 4)
  OR   (b.bus_number = '198AB' AND s.stop_order = 6)
  OR   (b.bus_number = '198AB' AND s.stop_order = 7)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 2)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 8)
  OR   (b.bus_number = '287UD' AND s.stop_order = 1)
  OR   (b.bus_number = '287UD' AND s.stop_order = 2)
  OR   (b.bus_number = '287UD' AND s.stop_order = 3)
  OR   (b.bus_number = '287UD' AND s.stop_order = 5)
  OR   (b.bus_number = '198NS' AND s.stop_order = 0)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '284UD' AND s.stop_order = 1)
  OR   (b.bus_number = '284UD' AND s.stop_order = 2)
  OR   (b.bus_number = '284UD' AND s.stop_order = 3)
  OR   (b.bus_number = '284UD' AND s.stop_order = 5)
  OR   (b.bus_number = '284UD' AND s.stop_order = 6)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '284AB' AND s.stop_order = 1)
  OR   (b.bus_number = '284AB' AND s.stop_order = 2)
  OR   (b.bus_number = '284AB' AND s.stop_order = 3)
  OR   (b.bus_number = '284AB' AND s.stop_order = 5)
  OR   (b.bus_number = '284AB' AND s.stop_order = 6)
  OR   (b.bus_number = '284AB' AND s.stop_order = 7)
  OR   (b.bus_number = '284AB' AND s.stop_order = 8)
  OR   (b.bus_number = '284AB' AND s.stop_order = 10)
  OR   (b.bus_number = '284NS' AND s.stop_order = 1)
  OR   (b.bus_number = '284NS' AND s.stop_order = 3)
  OR   (b.bus_number = '284NS' AND s.stop_order = 4)
  OR   (b.bus_number = '284NS' AND s.stop_order = 5)
  OR   (b.bus_number = '284NS' AND s.stop_order = 6)
  OR   (b.bus_number = '284NS' AND s.stop_order = 7)
  OR   (b.bus_number = '198UD' AND s.stop_order = 0)
  OR   (b.bus_number = '198UD' AND s.stop_order = 1)
  OR   (b.bus_number = '198UD' AND s.stop_order = 2)
  OR   (b.bus_number = '198UD' AND s.stop_order = 3)
  OR   (b.bus_number = '198UD' AND s.stop_order = 5)
  OR   (b.bus_number = '198AB' AND s.stop_order = 1)
  OR   (b.bus_number = '198AB' AND s.stop_order = 2)
  OR   (b.bus_number = '198AB' AND s.stop_order = 3)
  OR   (b.bus_number = '198AB' AND s.stop_order = 4)
  OR   (b.bus_number = '198AB' AND s.stop_order = 6)
  OR   (b.bus_number = '198AB' AND s.stop_order = 7)
  OR   (b.bus_number = '198MS' AND s.stop_order = 1)
  OR   (b.bus_number = '198MS' AND s.stop_order = 2)
  OR   (b.bus_number = '198MS' AND s.stop_order = 3)
  OR   (b.bus_number = '198MS' AND s.stop_order = 4)
  OR   (b.bus_number = '198MS' AND s.stop_order = 6)
  OR   (b.bus_number = '198MS' AND s.stop_order = 7)
  OR   (b.bus_number = '198LB' AND s.stop_order = 1)
  OR   (b.bus_number = '198LB' AND s.stop_order = 2)
  OR   (b.bus_number = '198LB' AND s.stop_order = 3)
  OR   (b.bus_number = '198LB' AND s.stop_order = 4)
  OR   (b.bus_number = '198LB' AND s.stop_order = 5)
  OR   (b.bus_number = '794UD' AND s.stop_order = 1)
  OR   (b.bus_number = '794UD' AND s.stop_order = 2)
  OR   (b.bus_number = '794UD' AND s.stop_order = 4)
  OR   (b.bus_number = '794UD' AND s.stop_order = 9)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '284UD' AND s.stop_order = 1)
  OR   (b.bus_number = '284UD' AND s.stop_order = 2)
  OR   (b.bus_number = '284UD' AND s.stop_order = 3)
  OR   (b.bus_number = '284UD' AND s.stop_order = 5)
  OR   (b.bus_number = '284UD' AND s.stop_order = 7)
  OR   (b.bus_number = '198UD' AND s.stop_order = 1)
  OR   (b.bus_number = '198UD' AND s.stop_order = 2)
  OR   (b.bus_number = '198UD' AND s.stop_order = 3)
  OR   (b.bus_number = '198UD' AND s.stop_order = 6)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '892NS' AND s.stop_order = 1)
  OR   (b.bus_number = '892NS' AND s.stop_order = 2)
  OR   (b.bus_number = '892NS' AND s.stop_order = 3)
  OR   (b.bus_number = '892NS' AND s.stop_order = 5)
  OR   (b.bus_number = '892NS' AND s.stop_order = 9)
  OR   (b.bus_number = '687UD' AND s.stop_order = 1)
  OR   (b.bus_number = '687UD' AND s.stop_order = 3)
  OR   (b.bus_number = '687UD' AND s.stop_order = 5)
  OR   (b.bus_number = '687UD' AND s.stop_order = 9)
  OR   (b.bus_number = '887NS' AND s.stop_order = 0)
  OR   (b.bus_number = '887NS' AND s.stop_order = 1)
  OR   (b.bus_number = '887NS' AND s.stop_order = 2)
  OR   (b.bus_number = '887NS' AND s.stop_order = 4)
  OR   (b.bus_number = '887NS' AND s.stop_order = 6)
  OR   (b.bus_number = '887UD' AND s.stop_order = 0)
  OR   (b.bus_number = '887UD' AND s.stop_order = 1)
  OR   (b.bus_number = '887UD' AND s.stop_order = 2)
  OR   (b.bus_number = '887UD' AND s.stop_order = 6)
  OR   (b.bus_number = '892UD' AND s.stop_order = 1)
  OR   (b.bus_number = '892UD' AND s.stop_order = 6)
  OR   (b.bus_number = '560EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '560EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '560EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '560EUD' AND s.stop_order = 5)
  OR   (b.bus_number = '560EUD' AND s.stop_order = 7)
  OR   (b.bus_number = '771EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '771EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '560CUD' AND s.stop_order = 1)
  OR   (b.bus_number = '560CUD' AND s.stop_order = 4)
  OR   (b.bus_number = '531VUD' AND s.stop_order = 4)
  OR   (b.bus_number = '42901' AND s.stop_order = 1)
  OR   (b.bus_number = '669UD' AND s.stop_order = 1)
  OR   (b.bus_number = '669UD' AND s.stop_order = 3)
  OR   (b.bus_number = '669UD' AND s.stop_order = 6)
  OR   (b.bus_number = '669UD' AND s.stop_order = 7)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 1)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 2)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 5)
  OR   (b.bus_number = '42902' AND s.stop_order = 1)
  OR   (b.bus_number = '510C' AND s.stop_order = 1)
  OR   (b.bus_number = '510D' AND s.stop_order = 1)
  OR   (b.bus_number = '120UD' AND s.stop_order = 0)
  OR   (b.bus_number = '120UD' AND s.stop_order = 2)
  OR   (b.bus_number = '845UD' AND s.stop_order = 4)
  OR   (b.bus_number = '845UD' AND s.stop_order = 6)
  OR   (b.bus_number = '133AC' AND s.stop_order = 2)
  OR   (b.bus_number = '144UD' AND s.stop_order = 3)
  OR   (b.bus_number = '126NS' AND s.stop_order = 1)
  OR   (b.bus_number = '145EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '133AC' AND s.stop_order = 2)
  OR   (b.bus_number = '133UD' AND s.stop_order = 2)
  OR   (b.bus_number = '857NS' AND s.stop_order = 4)
  OR   (b.bus_number = '531VUD' AND s.stop_order = 3)
  OR   (b.bus_number = '531VUD' AND s.stop_order = 5)
  OR   (b.bus_number = '175M' AND s.stop_order = 1)
  OR   (b.bus_number = '175N' AND s.stop_order = 1)
  OR   (b.bus_number = '281M' AND s.stop_order = 1)
  OR   (b.bus_number = '281AF' AND s.stop_order = 1)
  OR   (b.bus_number = '281Y' AND s.stop_order = 1)
  OR   (b.bus_number = '281Z' AND s.stop_order = 1)
  OR   (b.bus_number = '281AY' AND s.stop_order = 1)
  OR   (b.bus_number = '175O' AND s.stop_order = 1)
  OR   (b.bus_number = '175V' AND s.stop_order = 1)
  OR   (b.bus_number = '250A' AND s.stop_order = 1)
  OR   (b.bus_number = '281AN' AND s.stop_order = 1)
  OR   (b.bus_number = '281I' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '175D' AND s.stop_order = 1)
  OR   (b.bus_number = '213A' AND s.stop_order = 1)
  OR   (b.bus_number = '281P' AND s.stop_order = 1)
  OR   (b.bus_number = '175Q' AND s.stop_order = 1)
  OR   (b.bus_number = '275A' AND s.stop_order = 1)
  OR   (b.bus_number = '281AO' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '281AH' AND s.stop_order = 1)
  OR   (b.bus_number = '575A' AND s.stop_order = 1)
  OR   (b.bus_number = '175E' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '422AL' AND s.stop_order = 1)
  OR   (b.bus_number = '422AL' AND s.stop_order = 2)
  OR   (b.bus_number = '422AL' AND s.stop_order = 3)
  OR   (b.bus_number = '422AL' AND s.stop_order = 4)
  OR   (b.bus_number = '175A' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 2)
  OR   (b.bus_number = '422AC' AND s.stop_order = 3)
  OR   (b.bus_number = '775A' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '575B' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '175F' AND s.stop_order = 1)
  OR   (b.bus_number = '475B' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '422MS' AND s.stop_order = 1)
  OR   (b.bus_number = '422MS' AND s.stop_order = 2)
  OR   (b.bus_number = '422MS' AND s.stop_order = 3)
  OR   (b.bus_number = '422MS' AND s.stop_order = 4)
  OR   (b.bus_number = '375A' AND s.stop_order = 1)
  OR   (b.bus_number = '475C' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '281AS' AND s.stop_order = 1)
  OR   (b.bus_number = '281AX' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '281AB' AND s.stop_order = 1)
  OR   (b.bus_number = '281AV' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 2)
  OR   (b.bus_number = '422AC' AND s.stop_order = 3)
  OR   (b.bus_number = '281AU' AND s.stop_order = 1)
  OR   (b.bus_number = '281AG' AND s.stop_order = 1)
  OR   (b.bus_number = '281A' AND s.stop_order = 1)
  OR   (b.bus_number = '175U' AND s.stop_order = 1)
  OR   (b.bus_number = '975B' AND s.stop_order = 1)
  OR   (b.bus_number = '281K' AND s.stop_order = 1)
  OR   (b.bus_number = '281AJ' AND s.stop_order = 1)
  OR   (b.bus_number = '281B' AND s.stop_order = 1)
  OR   (b.bus_number = '281L' AND s.stop_order = 1)
  OR   (b.bus_number = '281E' AND s.stop_order = 1)
  OR   (b.bus_number = '281AI' AND s.stop_order = 1)
  OR   (b.bus_number = '281H' AND s.stop_order = 1)
  OR   (b.bus_number = '281AE' AND s.stop_order = 1)
  OR   (b.bus_number = '281J' AND s.stop_order = 1)
  OR   (b.bus_number = '281C' AND s.stop_order = 1)
  OR   (b.bus_number = '281D' AND s.stop_order = 1)
  OR   (b.bus_number = '175G' AND s.stop_order = 1)
  OR   (b.bus_number = '275B' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '375B' AND s.stop_order = 1)
  OR   (b.bus_number = '475D' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '575C' AND s.stop_order = 1)
  OR   (b.bus_number = '175S' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '475A' AND s.stop_order = 1)
  OR   (b.bus_number = '281AP' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '281N' AND s.stop_order = 1)
  OR   (b.bus_number = '281F' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '281G' AND s.stop_order = 1)
  OR   (b.bus_number = '281S' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 1)
  OR   (b.bus_number = '281AK' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '281X' AND s.stop_order = 1)
  OR   (b.bus_number = '281AQ' AND s.stop_order = 1)
  OR   (b.bus_number = '575D' AND s.stop_order = 1)
  OR   (b.bus_number = '874HUD' AND s.stop_order = 1)
  OR   (b.bus_number = '353B' AND s.stop_order = 1)
  OR   (b.bus_number = '353B' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 9)
  OR   (b.bus_number = '180UD' AND s.stop_order = 1)
  OR   (b.bus_number = '180UD' AND s.stop_order = 2)
  OR   (b.bus_number = '180UD' AND s.stop_order = 3)
  OR   (b.bus_number = '180UD' AND s.stop_order = 4)
  OR   (b.bus_number = '180UD' AND s.stop_order = 6)
  OR   (b.bus_number = '180UD' AND s.stop_order = 1)
  OR   (b.bus_number = '180UD' AND s.stop_order = 2)
  OR   (b.bus_number = '180UD' AND s.stop_order = 3)
  OR   (b.bus_number = '180UD' AND s.stop_order = 4)
  OR   (b.bus_number = '180UD' AND s.stop_order = 6)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '194UD' AND s.stop_order = 2)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 2)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '180MS' AND s.stop_order = 1)
  OR   (b.bus_number = '180MS' AND s.stop_order = 2)
  OR   (b.bus_number = '180MS' AND s.stop_order = 3)
  OR   (b.bus_number = '180MS' AND s.stop_order = 4)
  OR   (b.bus_number = '180MS' AND s.stop_order = 6)
  OR   (b.bus_number = '180MS' AND s.stop_order = 7)
  OR   (b.bus_number = '180MS' AND s.stop_order = 8)
  OR   (b.bus_number = '180AS' AND s.stop_order = 1)
  OR   (b.bus_number = '180AS' AND s.stop_order = 2)
  OR   (b.bus_number = '180AS' AND s.stop_order = 3)
  OR   (b.bus_number = '180AS' AND s.stop_order = 4)
  OR   (b.bus_number = '180AS' AND s.stop_order = 5)
  OR   (b.bus_number = '180AS' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 9)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
);

-- Chunk 4/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = '180AB' AND s.stop_order = 9 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '874LB' AND s.stop_order = 1 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874LB' AND s.stop_order = 3 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '874LB' AND s.stop_order = 5 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '874LB' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 1 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874NS' AND s.stop_order = 3 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 5 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '873UD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '873UD' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '873UD' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '873UD' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '873UD' AND s.stop_order = 7 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '873UD' AND s.stop_order = 8 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '873UD' AND s.stop_order = 11 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 1 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '874NS' AND s.stop_order = 2 THEN 'KOVILPATTI'
    WHEN b.bus_number = '874NS' AND s.stop_order = 3 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 4 THEN 'VIRUDHNAGAR BYPASS BS'
    WHEN b.bus_number = '874NS' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '620B' AND s.stop_order = 1 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '620A' AND s.stop_order = 1 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '620C' AND s.stop_order = 1 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '138UD' AND s.stop_order = 0 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '138UD' AND s.stop_order = 2 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 2 THEN 'MANAMADURAI'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 4 THEN 'TIRUPATHURRMD'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'SPL' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = 'SPL' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '550B' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 1 THEN 'SRIPERAMBUDUR'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 5 THEN 'KOVILPATTI'
    WHEN b.bus_number = '308AA' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AA' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AG' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AG' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308X' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308X' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182D' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308D' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308D' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AF' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AF' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308F' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308U' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308U' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308C' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AI' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AI' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123UD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501I' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501I' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123UD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501M' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501M' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501F' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 2 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 3 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123MS' AND s.stop_order = 4 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 5 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 6 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123NS' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123NS' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123NS' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AC' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '506E' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '506E' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501E' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501E' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501Z' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501Z' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '202NB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '202NB' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308V' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308V' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501Q' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501Q' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123LB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123LB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123LB' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123LB' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '512F' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '512F' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '512A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '512A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308K' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308K' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308O' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308O' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501W' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501W' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308W' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308W' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501P' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501P' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AC' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AB' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308J' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308J' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AE' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AE' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123UD' AND s.stop_order = 3 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308M' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308M' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'PADALUR BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 11 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '202NE' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '202NE' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308Y' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308Y' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'PADALUR BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 11 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308L' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308L' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123NS' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123NS' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 7 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 8 THEN 'PERAMBALUR 4WAY JUNCTION'
    WHEN b.bus_number = '123NS' AND s.stop_order = 9 THEN 'THOLUDUR TOLL GATE'
    WHEN b.bus_number = '123NS' AND s.stop_order = 10 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501G' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501G' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AJ' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AJ' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '503A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '503A' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 2 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 3 THEN 'SAMAYAPURAM BYPASS'
    WHEN b.bus_number = '123MS' AND s.stop_order = 4 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 5 THEN 'MAM COLLEGE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 6 THEN 'SRM COLLEGE'
    WHEN b.bus_number = '123MS' AND s.stop_order = 7 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308G' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308G' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308I' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308I' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '502B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '502B' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '807B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460G' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 2 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '827NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '827NS' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '827NS' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '827NS' AND s.stop_order = 4 THEN 'GUNASEELAM'
    WHEN b.bus_number = '827NS' AND s.stop_order = 5 THEN 'MUSIRI BYEPASS'
    WHEN b.bus_number = '827NS' AND s.stop_order = 6 THEN 'THOTTIYAM'
    WHEN b.bus_number = '827NS' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '460D' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460H' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '827NS' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '827NS' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '827NS' AND s.stop_order = 4 THEN 'GUNASEELAM'
    WHEN b.bus_number = '827NS' AND s.stop_order = 5 THEN 'MUSIRI'
    WHEN b.bus_number = '827NS' AND s.stop_order = 6 THEN 'THOTTIYAM'
    WHEN b.bus_number = '827NS' AND s.stop_order = 8 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '353B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460E' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '457L' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '360E' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '360D' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '831UD' AND s.stop_order = 0 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '831UD' AND s.stop_order = 1 THEN 'SAVEETHA DENTAL COLLEGE(OPP)'
    WHEN b.bus_number = '831UD' AND s.stop_order = 2 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '831UD' AND s.stop_order = 3 THEN 'SRIPERUMBUDUR TOLL'
    WHEN b.bus_number = '831UD' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831UD' AND s.stop_order = 0 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '831UD' AND s.stop_order = 1 THEN 'SAVEETHA DENTAL COLLEGE(OPP)'
    WHEN b.bus_number = '831UD' AND s.stop_order = 2 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '831UD' AND s.stop_order = 3 THEN 'SRIPERUMBUDUR TOLL'
    WHEN b.bus_number = '831UD' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '831UD' AND s.stop_order = 0 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '831UD' AND s.stop_order = 1 THEN 'SAVEETHA DENTAL COLLEGE(OPP)'
    WHEN b.bus_number = '831UD' AND s.stop_order = 2 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '831UD' AND s.stop_order = 3 THEN 'SRIPERUMBUDUR TOLL'
    WHEN b.bus_number = '831UD' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '451V' AND s.stop_order = 2 THEN 'SATELLITE BS'
    WHEN b.bus_number = '451Y' AND s.stop_order = 2 THEN 'SATELLITE BS'
    WHEN b.bus_number = '451X' AND s.stop_order = 2 THEN 'SATELLITE BS'
    WHEN b.bus_number = '132UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '132UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '132UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '132UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '132UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '132UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '132UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '132AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '132AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '132AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '132AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '132AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '132AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '132AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '132NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '132NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '132NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '132NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '132NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '132NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '132NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '241I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '204A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241U' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '241H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '323AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '241B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241S' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205L' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241T' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241V' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '241R' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '205I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '241F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '241A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323TMS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 9)
  OR   (b.bus_number = '874LB' AND s.stop_order = 1)
  OR   (b.bus_number = '874LB' AND s.stop_order = 3)
  OR   (b.bus_number = '874LB' AND s.stop_order = 5)
  OR   (b.bus_number = '874LB' AND s.stop_order = 8)
  OR   (b.bus_number = '874NS' AND s.stop_order = 1)
  OR   (b.bus_number = '874NS' AND s.stop_order = 3)
  OR   (b.bus_number = '874NS' AND s.stop_order = 5)
  OR   (b.bus_number = '874NS' AND s.stop_order = 8)
  OR   (b.bus_number = '873UD' AND s.stop_order = 1)
  OR   (b.bus_number = '873UD' AND s.stop_order = 2)
  OR   (b.bus_number = '873UD' AND s.stop_order = 3)
  OR   (b.bus_number = '873UD' AND s.stop_order = 4)
  OR   (b.bus_number = '873UD' AND s.stop_order = 7)
  OR   (b.bus_number = '873UD' AND s.stop_order = 8)
  OR   (b.bus_number = '873UD' AND s.stop_order = 11)
  OR   (b.bus_number = '874NS' AND s.stop_order = 1)
  OR   (b.bus_number = '874NS' AND s.stop_order = 2)
  OR   (b.bus_number = '874NS' AND s.stop_order = 3)
  OR   (b.bus_number = '874NS' AND s.stop_order = 4)
  OR   (b.bus_number = '874NS' AND s.stop_order = 7)
  OR   (b.bus_number = '620B' AND s.stop_order = 1)
  OR   (b.bus_number = '620A' AND s.stop_order = 1)
  OR   (b.bus_number = '620C' AND s.stop_order = 1)
  OR   (b.bus_number = '138UD' AND s.stop_order = 0)
  OR   (b.bus_number = '138UD' AND s.stop_order = 2)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 2)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 4)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 5)
  OR   (b.bus_number = 'SPL' AND s.stop_order = 0)
  OR   (b.bus_number = 'SPL' AND s.stop_order = 1)
  OR   (b.bus_number = '550B' AND s.stop_order = 0)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 1)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 3)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 4)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 5)
  OR   (b.bus_number = '308AA' AND s.stop_order = 0)
  OR   (b.bus_number = '308AA' AND s.stop_order = 1)
  OR   (b.bus_number = '308AG' AND s.stop_order = 0)
  OR   (b.bus_number = '308AG' AND s.stop_order = 1)
  OR   (b.bus_number = '308X' AND s.stop_order = 0)
  OR   (b.bus_number = '308X' AND s.stop_order = 1)
  OR   (b.bus_number = '182D' AND s.stop_order = 0)
  OR   (b.bus_number = '182D' AND s.stop_order = 1)
  OR   (b.bus_number = '308D' AND s.stop_order = 0)
  OR   (b.bus_number = '308D' AND s.stop_order = 1)
  OR   (b.bus_number = '308AF' AND s.stop_order = 0)
  OR   (b.bus_number = '308AF' AND s.stop_order = 1)
  OR   (b.bus_number = '308F' AND s.stop_order = 0)
  OR   (b.bus_number = '308F' AND s.stop_order = 1)
  OR   (b.bus_number = '182C' AND s.stop_order = 0)
  OR   (b.bus_number = '182C' AND s.stop_order = 1)
  OR   (b.bus_number = '308B' AND s.stop_order = 0)
  OR   (b.bus_number = '308B' AND s.stop_order = 1)
  OR   (b.bus_number = '308U' AND s.stop_order = 0)
  OR   (b.bus_number = '308U' AND s.stop_order = 1)
  OR   (b.bus_number = '308C' AND s.stop_order = 0)
  OR   (b.bus_number = '308C' AND s.stop_order = 1)
  OR   (b.bus_number = '308AI' AND s.stop_order = 0)
  OR   (b.bus_number = '308AI' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '123UD' AND s.stop_order = 3)
  OR   (b.bus_number = '501I' AND s.stop_order = 0)
  OR   (b.bus_number = '501I' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '123UD' AND s.stop_order = 3)
  OR   (b.bus_number = '501M' AND s.stop_order = 0)
  OR   (b.bus_number = '501M' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '501F' AND s.stop_order = 0)
  OR   (b.bus_number = '501F' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 0)
  OR   (b.bus_number = '123MS' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 2)
  OR   (b.bus_number = '123MS' AND s.stop_order = 3)
  OR   (b.bus_number = '123MS' AND s.stop_order = 4)
  OR   (b.bus_number = '123MS' AND s.stop_order = 5)
  OR   (b.bus_number = '123MS' AND s.stop_order = 6)
  OR   (b.bus_number = '123MS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 0)
  OR   (b.bus_number = '123NS' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 2)
  OR   (b.bus_number = '123NS' AND s.stop_order = 3)
  OR   (b.bus_number = '123NS' AND s.stop_order = 4)
  OR   (b.bus_number = '123NS' AND s.stop_order = 5)
  OR   (b.bus_number = '123NS' AND s.stop_order = 6)
  OR   (b.bus_number = '123NS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 8)
  OR   (b.bus_number = '123NS' AND s.stop_order = 9)
  OR   (b.bus_number = '123NS' AND s.stop_order = 10)
  OR   (b.bus_number = '501AC' AND s.stop_order = 0)
  OR   (b.bus_number = '501AC' AND s.stop_order = 1)
  OR   (b.bus_number = '506E' AND s.stop_order = 0)
  OR   (b.bus_number = '506E' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '501E' AND s.stop_order = 0)
  OR   (b.bus_number = '501E' AND s.stop_order = 1)
  OR   (b.bus_number = '501Z' AND s.stop_order = 0)
  OR   (b.bus_number = '501Z' AND s.stop_order = 1)
  OR   (b.bus_number = '202NB' AND s.stop_order = 0)
  OR   (b.bus_number = '202NB' AND s.stop_order = 1)
  OR   (b.bus_number = '308S' AND s.stop_order = 0)
  OR   (b.bus_number = '308S' AND s.stop_order = 1)
  OR   (b.bus_number = '308V' AND s.stop_order = 0)
  OR   (b.bus_number = '308V' AND s.stop_order = 1)
  OR   (b.bus_number = '308N' AND s.stop_order = 0)
  OR   (b.bus_number = '308N' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '501Q' AND s.stop_order = 0)
  OR   (b.bus_number = '501Q' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 0)
  OR   (b.bus_number = '123LB' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 2)
  OR   (b.bus_number = '123LB' AND s.stop_order = 3)
  OR   (b.bus_number = '123LB' AND s.stop_order = 4)
  OR   (b.bus_number = '123LB' AND s.stop_order = 5)
  OR   (b.bus_number = '123LB' AND s.stop_order = 6)
  OR   (b.bus_number = '123LB' AND s.stop_order = 7)
  OR   (b.bus_number = '123LB' AND s.stop_order = 8)
  OR   (b.bus_number = '123LB' AND s.stop_order = 9)
  OR   (b.bus_number = '123LB' AND s.stop_order = 10)
  OR   (b.bus_number = '512F' AND s.stop_order = 0)
  OR   (b.bus_number = '512F' AND s.stop_order = 1)
  OR   (b.bus_number = '512A' AND s.stop_order = 0)
  OR   (b.bus_number = '512A' AND s.stop_order = 1)
  OR   (b.bus_number = '308K' AND s.stop_order = 0)
  OR   (b.bus_number = '308K' AND s.stop_order = 1)
  OR   (b.bus_number = '308O' AND s.stop_order = 0)
  OR   (b.bus_number = '308O' AND s.stop_order = 1)
  OR   (b.bus_number = '501W' AND s.stop_order = 0)
  OR   (b.bus_number = '501W' AND s.stop_order = 1)
  OR   (b.bus_number = '308W' AND s.stop_order = 0)
  OR   (b.bus_number = '308W' AND s.stop_order = 1)
  OR   (b.bus_number = '308A' AND s.stop_order = 0)
  OR   (b.bus_number = '308A' AND s.stop_order = 1)
  OR   (b.bus_number = '501P' AND s.stop_order = 0)
  OR   (b.bus_number = '501P' AND s.stop_order = 1)
  OR   (b.bus_number = '308AC' AND s.stop_order = 0)
  OR   (b.bus_number = '308AC' AND s.stop_order = 1)
  OR   (b.bus_number = '308AB' AND s.stop_order = 0)
  OR   (b.bus_number = '308AB' AND s.stop_order = 1)
  OR   (b.bus_number = '308J' AND s.stop_order = 0)
  OR   (b.bus_number = '308J' AND s.stop_order = 1)
  OR   (b.bus_number = '308AE' AND s.stop_order = 0)
  OR   (b.bus_number = '308AE' AND s.stop_order = 1)
  OR   (b.bus_number = '182B' AND s.stop_order = 0)
  OR   (b.bus_number = '182B' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '123UD' AND s.stop_order = 3)
  OR   (b.bus_number = '308M' AND s.stop_order = 0)
  OR   (b.bus_number = '308M' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '123AB' AND s.stop_order = 11)
  OR   (b.bus_number = '308S' AND s.stop_order = 0)
  OR   (b.bus_number = '308S' AND s.stop_order = 1)
  OR   (b.bus_number = '202NE' AND s.stop_order = 0)
  OR   (b.bus_number = '202NE' AND s.stop_order = 1)
  OR   (b.bus_number = '308N' AND s.stop_order = 0)
  OR   (b.bus_number = '308N' AND s.stop_order = 1)
  OR   (b.bus_number = '308Y' AND s.stop_order = 0)
  OR   (b.bus_number = '308Y' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '123AB' AND s.stop_order = 11)
  OR   (b.bus_number = '308AD' AND s.stop_order = 0)
  OR   (b.bus_number = '308AD' AND s.stop_order = 1)
  OR   (b.bus_number = '308P' AND s.stop_order = 0)
  OR   (b.bus_number = '308P' AND s.stop_order = 1)
  OR   (b.bus_number = '308L' AND s.stop_order = 0)
  OR   (b.bus_number = '308L' AND s.stop_order = 1)
  OR   (b.bus_number = '308Z' AND s.stop_order = 0)
  OR   (b.bus_number = '308Z' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 0)
  OR   (b.bus_number = '123NS' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 2)
  OR   (b.bus_number = '123NS' AND s.stop_order = 3)
  OR   (b.bus_number = '123NS' AND s.stop_order = 4)
  OR   (b.bus_number = '123NS' AND s.stop_order = 5)
  OR   (b.bus_number = '123NS' AND s.stop_order = 6)
  OR   (b.bus_number = '123NS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 8)
  OR   (b.bus_number = '123NS' AND s.stop_order = 9)
  OR   (b.bus_number = '123NS' AND s.stop_order = 10)
  OR   (b.bus_number = '501G' AND s.stop_order = 0)
  OR   (b.bus_number = '501G' AND s.stop_order = 1)
  OR   (b.bus_number = '501AJ' AND s.stop_order = 0)
  OR   (b.bus_number = '501AJ' AND s.stop_order = 1)
  OR   (b.bus_number = '503A' AND s.stop_order = 0)
  OR   (b.bus_number = '503A' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123MS' AND s.stop_order = 0)
  OR   (b.bus_number = '123MS' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 2)
  OR   (b.bus_number = '123MS' AND s.stop_order = 3)
  OR   (b.bus_number = '123MS' AND s.stop_order = 4)
  OR   (b.bus_number = '123MS' AND s.stop_order = 5)
  OR   (b.bus_number = '123MS' AND s.stop_order = 6)
  OR   (b.bus_number = '123MS' AND s.stop_order = 7)
  OR   (b.bus_number = '308G' AND s.stop_order = 0)
  OR   (b.bus_number = '308G' AND s.stop_order = 1)
  OR   (b.bus_number = '308I' AND s.stop_order = 0)
  OR   (b.bus_number = '308I' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '502B' AND s.stop_order = 0)
  OR   (b.bus_number = '502B' AND s.stop_order = 1)
  OR   (b.bus_number = '807B' AND s.stop_order = 0)
  OR   (b.bus_number = '460A' AND s.stop_order = 0)
  OR   (b.bus_number = '460C' AND s.stop_order = 0)
  OR   (b.bus_number = '460G' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 2)
  OR   (b.bus_number = '827NS' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 1)
  OR   (b.bus_number = '827NS' AND s.stop_order = 2)
  OR   (b.bus_number = '827NS' AND s.stop_order = 3)
  OR   (b.bus_number = '827NS' AND s.stop_order = 4)
  OR   (b.bus_number = '827NS' AND s.stop_order = 5)
  OR   (b.bus_number = '827NS' AND s.stop_order = 6)
  OR   (b.bus_number = '827NS' AND s.stop_order = 8)
  OR   (b.bus_number = '460D' AND s.stop_order = 0)
  OR   (b.bus_number = '460H' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 1)
  OR   (b.bus_number = '827NS' AND s.stop_order = 2)
  OR   (b.bus_number = '827NS' AND s.stop_order = 3)
  OR   (b.bus_number = '827NS' AND s.stop_order = 4)
  OR   (b.bus_number = '827NS' AND s.stop_order = 5)
  OR   (b.bus_number = '827NS' AND s.stop_order = 6)
  OR   (b.bus_number = '827NS' AND s.stop_order = 8)
  OR   (b.bus_number = '353B' AND s.stop_order = 0)
  OR   (b.bus_number = '460E' AND s.stop_order = 0)
  OR   (b.bus_number = '457L' AND s.stop_order = 0)
  OR   (b.bus_number = '360E' AND s.stop_order = 0)
  OR   (b.bus_number = '360D' AND s.stop_order = 0)
  OR   (b.bus_number = '831UD' AND s.stop_order = 0)
  OR   (b.bus_number = '831UD' AND s.stop_order = 1)
  OR   (b.bus_number = '831UD' AND s.stop_order = 2)
  OR   (b.bus_number = '831UD' AND s.stop_order = 3)
  OR   (b.bus_number = '831UD' AND s.stop_order = 7)
  OR   (b.bus_number = '831UD' AND s.stop_order = 0)
  OR   (b.bus_number = '831UD' AND s.stop_order = 1)
  OR   (b.bus_number = '831UD' AND s.stop_order = 2)
  OR   (b.bus_number = '831UD' AND s.stop_order = 3)
  OR   (b.bus_number = '831UD' AND s.stop_order = 7)
  OR   (b.bus_number = '831UD' AND s.stop_order = 0)
  OR   (b.bus_number = '831UD' AND s.stop_order = 1)
  OR   (b.bus_number = '831UD' AND s.stop_order = 2)
  OR   (b.bus_number = '831UD' AND s.stop_order = 3)
  OR   (b.bus_number = '831UD' AND s.stop_order = 7)
  OR   (b.bus_number = '451V' AND s.stop_order = 2)
  OR   (b.bus_number = '451Y' AND s.stop_order = 2)
  OR   (b.bus_number = '451X' AND s.stop_order = 2)
  OR   (b.bus_number = '132UD' AND s.stop_order = 0)
  OR   (b.bus_number = '132UD' AND s.stop_order = 1)
  OR   (b.bus_number = '132UD' AND s.stop_order = 2)
  OR   (b.bus_number = '132UD' AND s.stop_order = 3)
  OR   (b.bus_number = '132UD' AND s.stop_order = 4)
  OR   (b.bus_number = '132UD' AND s.stop_order = 5)
  OR   (b.bus_number = '132UD' AND s.stop_order = 6)
  OR   (b.bus_number = '132AC' AND s.stop_order = 0)
  OR   (b.bus_number = '132AC' AND s.stop_order = 1)
  OR   (b.bus_number = '132AC' AND s.stop_order = 2)
  OR   (b.bus_number = '132AC' AND s.stop_order = 3)
  OR   (b.bus_number = '132AC' AND s.stop_order = 4)
  OR   (b.bus_number = '132AC' AND s.stop_order = 5)
  OR   (b.bus_number = '132AC' AND s.stop_order = 6)
  OR   (b.bus_number = '132NS' AND s.stop_order = 0)
  OR   (b.bus_number = '132NS' AND s.stop_order = 1)
  OR   (b.bus_number = '132NS' AND s.stop_order = 2)
  OR   (b.bus_number = '132NS' AND s.stop_order = 3)
  OR   (b.bus_number = '132NS' AND s.stop_order = 4)
  OR   (b.bus_number = '132NS' AND s.stop_order = 5)
  OR   (b.bus_number = '132NS' AND s.stop_order = 6)
  OR   (b.bus_number = '241I' AND s.stop_order = 0)
  OR   (b.bus_number = '241C' AND s.stop_order = 0)
  OR   (b.bus_number = '204A' AND s.stop_order = 0)
  OR   (b.bus_number = '241U' AND s.stop_order = 0)
  OR   (b.bus_number = '241G' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 7)
  OR   (b.bus_number = '323UD' AND s.stop_order = 8)
  OR   (b.bus_number = '323AB' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 1)
  OR   (b.bus_number = '323AB' AND s.stop_order = 2)
  OR   (b.bus_number = '323AB' AND s.stop_order = 3)
  OR   (b.bus_number = '323AB' AND s.stop_order = 4)
  OR   (b.bus_number = '323AB' AND s.stop_order = 5)
  OR   (b.bus_number = '323AB' AND s.stop_order = 6)
  OR   (b.bus_number = '323AB' AND s.stop_order = 7)
  OR   (b.bus_number = '323AB' AND s.stop_order = 8)
  OR   (b.bus_number = '241H' AND s.stop_order = 0)
  OR   (b.bus_number = '241H' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 7)
  OR   (b.bus_number = '323UD' AND s.stop_order = 8)
  OR   (b.bus_number = '323AB' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 1)
  OR   (b.bus_number = '323AB' AND s.stop_order = 2)
  OR   (b.bus_number = '323AB' AND s.stop_order = 3)
  OR   (b.bus_number = '323AB' AND s.stop_order = 4)
  OR   (b.bus_number = '323AB' AND s.stop_order = 5)
  OR   (b.bus_number = '323AB' AND s.stop_order = 6)
  OR   (b.bus_number = '323AB' AND s.stop_order = 7)
  OR   (b.bus_number = '323AB' AND s.stop_order = 8)
  OR   (b.bus_number = '323NS' AND s.stop_order = 0)
  OR   (b.bus_number = '323NS' AND s.stop_order = 1)
  OR   (b.bus_number = '323NS' AND s.stop_order = 2)
  OR   (b.bus_number = '323NS' AND s.stop_order = 3)
  OR   (b.bus_number = '323NS' AND s.stop_order = 4)
  OR   (b.bus_number = '323NS' AND s.stop_order = 5)
  OR   (b.bus_number = '323NS' AND s.stop_order = 6)
  OR   (b.bus_number = '323NS' AND s.stop_order = 0)
  OR   (b.bus_number = '323NS' AND s.stop_order = 1)
  OR   (b.bus_number = '323NS' AND s.stop_order = 2)
  OR   (b.bus_number = '323NS' AND s.stop_order = 3)
  OR   (b.bus_number = '323NS' AND s.stop_order = 4)
  OR   (b.bus_number = '323NS' AND s.stop_order = 5)
  OR   (b.bus_number = '323NS' AND s.stop_order = 6)
  OR   (b.bus_number = '323NS' AND s.stop_order = 7)
  OR   (b.bus_number = '323NS' AND s.stop_order = 8)
  OR   (b.bus_number = '323AB' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 1)
  OR   (b.bus_number = '323AB' AND s.stop_order = 2)
  OR   (b.bus_number = '323AB' AND s.stop_order = 3)
  OR   (b.bus_number = '323AB' AND s.stop_order = 4)
  OR   (b.bus_number = '323AB' AND s.stop_order = 5)
  OR   (b.bus_number = '323AB' AND s.stop_order = 6)
  OR   (b.bus_number = '323AB' AND s.stop_order = 7)
  OR   (b.bus_number = '323AB' AND s.stop_order = 8)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 7)
  OR   (b.bus_number = '323UD' AND s.stop_order = 8)
  OR   (b.bus_number = '323AC' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 1)
  OR   (b.bus_number = '323AC' AND s.stop_order = 2)
  OR   (b.bus_number = '323AC' AND s.stop_order = 3)
  OR   (b.bus_number = '323AC' AND s.stop_order = 4)
  OR   (b.bus_number = '323AC' AND s.stop_order = 5)
  OR   (b.bus_number = '323AC' AND s.stop_order = 6)
  OR   (b.bus_number = '241B' AND s.stop_order = 0)
  OR   (b.bus_number = '241S' AND s.stop_order = 0)
  OR   (b.bus_number = '205H' AND s.stop_order = 0)
  OR   (b.bus_number = '205L' AND s.stop_order = 0)
  OR   (b.bus_number = '241T' AND s.stop_order = 0)
  OR   (b.bus_number = '241V' AND s.stop_order = 0)
  OR   (b.bus_number = '241R' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 7)
  OR   (b.bus_number = '323UD' AND s.stop_order = 8)
  OR   (b.bus_number = '205I' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 1)
  OR   (b.bus_number = '323AB' AND s.stop_order = 2)
  OR   (b.bus_number = '323AB' AND s.stop_order = 3)
  OR   (b.bus_number = '323AB' AND s.stop_order = 4)
  OR   (b.bus_number = '323AB' AND s.stop_order = 5)
  OR   (b.bus_number = '323AB' AND s.stop_order = 6)
  OR   (b.bus_number = '323AB' AND s.stop_order = 7)
  OR   (b.bus_number = '323AB' AND s.stop_order = 8)
  OR   (b.bus_number = '241F' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 1)
  OR   (b.bus_number = '323AC' AND s.stop_order = 2)
  OR   (b.bus_number = '323AC' AND s.stop_order = 3)
  OR   (b.bus_number = '323AC' AND s.stop_order = 4)
  OR   (b.bus_number = '323AC' AND s.stop_order = 5)
  OR   (b.bus_number = '323AC' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 7)
  OR   (b.bus_number = '323UD' AND s.stop_order = 8)
  OR   (b.bus_number = '241A' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 0)
  OR   (b.bus_number = '323AB' AND s.stop_order = 1)
  OR   (b.bus_number = '323AB' AND s.stop_order = 2)
  OR   (b.bus_number = '323AB' AND s.stop_order = 3)
  OR   (b.bus_number = '323AB' AND s.stop_order = 4)
  OR   (b.bus_number = '323AB' AND s.stop_order = 5)
  OR   (b.bus_number = '323AB' AND s.stop_order = 6)
  OR   (b.bus_number = '323AB' AND s.stop_order = 7)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 0)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 1)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 2)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 3)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 4)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 5)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 6)
  OR   (b.bus_number = '323TMS' AND s.stop_order = 7)
  OR   (b.bus_number = '323NS' AND s.stop_order = 0)
  OR   (b.bus_number = '323NS' AND s.stop_order = 1)
  OR   (b.bus_number = '323NS' AND s.stop_order = 2)
  OR   (b.bus_number = '323NS' AND s.stop_order = 3)
  OR   (b.bus_number = '323NS' AND s.stop_order = 4)
  OR   (b.bus_number = '323NS' AND s.stop_order = 5)
  OR   (b.bus_number = '323NS' AND s.stop_order = 6)
  OR   (b.bus_number = '323NS' AND s.stop_order = 7)
  OR   (b.bus_number = '323NS' AND s.stop_order = 0)
);

-- Chunk 5/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '323NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '241W' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '323UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '323AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '323AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '323UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '323UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '562F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '562F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '512F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '512F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '512A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '512A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501W' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501W' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501P' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501P' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510E' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '908AU' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '908AU' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '506F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '506F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '908AI' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '908AI' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '507A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '507A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123LB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123LB' AND s.stop_order = 8 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308V' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308V' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308E' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308K' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123NS' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308O' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308O' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308W' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308W' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '504B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '504B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123NS' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '506G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '506G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '505B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123UD' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123UD' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123UD' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123UD' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123UD' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308J' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AC' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AC' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AJ' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AJ' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '503A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '503A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123MS' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '511A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '511A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123NS' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123NS' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '502B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '502B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AE' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AE' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AC' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308M' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308S' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308N' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308Y' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308Y' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308Z' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308R' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308R' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AL' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AL' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AL' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AL' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AL' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AL' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AD' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308I' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AA' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AA' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308P' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AG' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AG' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308X' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308X' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308AF' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308AF' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '182C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '182C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '308U' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308U' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501R' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501R' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '506B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '506B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AD' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '505A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508J' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 9 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123KUD' AND s.stop_order = 11 THEN 'KARAMBAKKUDI BS'
    WHEN b.bus_number = '123UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123UD' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AB' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '511B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '511B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123LB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123LB' AND s.stop_order = 8 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AB' AND s.stop_order = 8 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123LB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123LB' AND s.stop_order = 8 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123MS' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123MS' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '506H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '506H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 5 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AB' AND s.stop_order = 3 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '501AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '501AC' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123LB' AND s.stop_order = 3 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123LB' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '508D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '123AL' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AL' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '123AL' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '123AL' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '123AL' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '123AL' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '123AL' AND s.stop_order = 10 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '123AB' AND s.stop_order = 1 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '123AB' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '133UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '133UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '133UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '133UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '133UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '133UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '133UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '133UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '133UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '133UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '133UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '422UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '422UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '026P' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '026P' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '144A2' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '144A2' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '146I1' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '146I1' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '015C' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '015C' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '161B2' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '161B2' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '636UD' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '636UD' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '142A2' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '142A2' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '131CA1' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '131CA1' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '785UD' AND s.stop_order = 1 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '785UD' AND s.stop_order = 2 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '785UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '636UD' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '636UD' AND s.stop_order = 1 THEN 'POLLACHI'
    WHEN b.bus_number = '636UD' AND s.stop_order = 2 THEN 'UDUMALPET'
    WHEN b.bus_number = '636UD' AND s.stop_order = 3 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '636UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '144A2' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '144A2' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '863D' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '863A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '863C' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '722UD' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '722UD' AND s.stop_order = 2 THEN 'SULUR'
    WHEN b.bus_number = '722UD' AND s.stop_order = 5 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '866C' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '863B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '962TNS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '962TNS' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '962TNS' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '787UD' AND s.stop_order = 0 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '787UD' AND s.stop_order = 1 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '787UD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '787UD' AND s.stop_order = 4 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '787UD' AND s.stop_order = 5 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '962AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '962AB' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '962AB' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '323NS' AND s.stop_order = 1)
  OR   (b.bus_number = '323NS' AND s.stop_order = 2)
  OR   (b.bus_number = '323NS' AND s.stop_order = 3)
  OR   (b.bus_number = '323NS' AND s.stop_order = 4)
  OR   (b.bus_number = '323NS' AND s.stop_order = 5)
  OR   (b.bus_number = '323NS' AND s.stop_order = 6)
  OR   (b.bus_number = '323NS' AND s.stop_order = 7)
  OR   (b.bus_number = '241W' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 1)
  OR   (b.bus_number = '323AC' AND s.stop_order = 2)
  OR   (b.bus_number = '323AC' AND s.stop_order = 3)
  OR   (b.bus_number = '323AC' AND s.stop_order = 4)
  OR   (b.bus_number = '323AC' AND s.stop_order = 5)
  OR   (b.bus_number = '323AC' AND s.stop_order = 6)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '323UD' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 5)
  OR   (b.bus_number = '323UD' AND s.stop_order = 6)
  OR   (b.bus_number = '323AC' AND s.stop_order = 0)
  OR   (b.bus_number = '323AC' AND s.stop_order = 1)
  OR   (b.bus_number = '323AC' AND s.stop_order = 2)
  OR   (b.bus_number = '323AC' AND s.stop_order = 3)
  OR   (b.bus_number = '323AC' AND s.stop_order = 4)
  OR   (b.bus_number = '323UD' AND s.stop_order = 0)
  OR   (b.bus_number = '323UD' AND s.stop_order = 1)
  OR   (b.bus_number = '323UD' AND s.stop_order = 2)
  OR   (b.bus_number = '323UD' AND s.stop_order = 3)
  OR   (b.bus_number = '562F' AND s.stop_order = 0)
  OR   (b.bus_number = '562F' AND s.stop_order = 1)
  OR   (b.bus_number = '512F' AND s.stop_order = 0)
  OR   (b.bus_number = '512F' AND s.stop_order = 1)
  OR   (b.bus_number = '512A' AND s.stop_order = 0)
  OR   (b.bus_number = '512A' AND s.stop_order = 1)
  OR   (b.bus_number = '501W' AND s.stop_order = 0)
  OR   (b.bus_number = '501W' AND s.stop_order = 1)
  OR   (b.bus_number = '501P' AND s.stop_order = 0)
  OR   (b.bus_number = '501P' AND s.stop_order = 1)
  OR   (b.bus_number = '508A' AND s.stop_order = 0)
  OR   (b.bus_number = '508A' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '510B' AND s.stop_order = 0)
  OR   (b.bus_number = '510B' AND s.stop_order = 1)
  OR   (b.bus_number = '510E' AND s.stop_order = 0)
  OR   (b.bus_number = '510E' AND s.stop_order = 1)
  OR   (b.bus_number = '508C' AND s.stop_order = 0)
  OR   (b.bus_number = '508C' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '508H' AND s.stop_order = 0)
  OR   (b.bus_number = '508H' AND s.stop_order = 1)
  OR   (b.bus_number = '510H' AND s.stop_order = 0)
  OR   (b.bus_number = '510H' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '908AU' AND s.stop_order = 0)
  OR   (b.bus_number = '908AU' AND s.stop_order = 1)
  OR   (b.bus_number = '510G' AND s.stop_order = 0)
  OR   (b.bus_number = '510G' AND s.stop_order = 1)
  OR   (b.bus_number = '506F' AND s.stop_order = 0)
  OR   (b.bus_number = '506F' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '508B' AND s.stop_order = 0)
  OR   (b.bus_number = '508B' AND s.stop_order = 1)
  OR   (b.bus_number = '908AI' AND s.stop_order = 0)
  OR   (b.bus_number = '908AI' AND s.stop_order = 1)
  OR   (b.bus_number = '507A' AND s.stop_order = 0)
  OR   (b.bus_number = '507A' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 0)
  OR   (b.bus_number = '123LB' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 2)
  OR   (b.bus_number = '123LB' AND s.stop_order = 3)
  OR   (b.bus_number = '123LB' AND s.stop_order = 4)
  OR   (b.bus_number = '123LB' AND s.stop_order = 5)
  OR   (b.bus_number = '123LB' AND s.stop_order = 6)
  OR   (b.bus_number = '123LB' AND s.stop_order = 7)
  OR   (b.bus_number = '123LB' AND s.stop_order = 8)
  OR   (b.bus_number = '308V' AND s.stop_order = 0)
  OR   (b.bus_number = '308V' AND s.stop_order = 1)
  OR   (b.bus_number = '308E' AND s.stop_order = 0)
  OR   (b.bus_number = '308E' AND s.stop_order = 1)
  OR   (b.bus_number = '308K' AND s.stop_order = 0)
  OR   (b.bus_number = '308K' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 0)
  OR   (b.bus_number = '123NS' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 2)
  OR   (b.bus_number = '123NS' AND s.stop_order = 3)
  OR   (b.bus_number = '123NS' AND s.stop_order = 4)
  OR   (b.bus_number = '123NS' AND s.stop_order = 5)
  OR   (b.bus_number = '123NS' AND s.stop_order = 6)
  OR   (b.bus_number = '123NS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 8)
  OR   (b.bus_number = '123NS' AND s.stop_order = 9)
  OR   (b.bus_number = '123NS' AND s.stop_order = 10)
  OR   (b.bus_number = '308O' AND s.stop_order = 0)
  OR   (b.bus_number = '308O' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '308W' AND s.stop_order = 0)
  OR   (b.bus_number = '308W' AND s.stop_order = 1)
  OR   (b.bus_number = '504B' AND s.stop_order = 0)
  OR   (b.bus_number = '504B' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 0)
  OR   (b.bus_number = '123NS' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 2)
  OR   (b.bus_number = '123NS' AND s.stop_order = 3)
  OR   (b.bus_number = '123NS' AND s.stop_order = 4)
  OR   (b.bus_number = '123NS' AND s.stop_order = 5)
  OR   (b.bus_number = '123NS' AND s.stop_order = 6)
  OR   (b.bus_number = '123NS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 8)
  OR   (b.bus_number = '123NS' AND s.stop_order = 9)
  OR   (b.bus_number = '123NS' AND s.stop_order = 10)
  OR   (b.bus_number = '506G' AND s.stop_order = 0)
  OR   (b.bus_number = '506G' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '505B' AND s.stop_order = 0)
  OR   (b.bus_number = '505B' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '123UD' AND s.stop_order = 3)
  OR   (b.bus_number = '123UD' AND s.stop_order = 4)
  OR   (b.bus_number = '123UD' AND s.stop_order = 5)
  OR   (b.bus_number = '123UD' AND s.stop_order = 6)
  OR   (b.bus_number = '123UD' AND s.stop_order = 7)
  OR   (b.bus_number = '123UD' AND s.stop_order = 8)
  OR   (b.bus_number = '123UD' AND s.stop_order = 9)
  OR   (b.bus_number = '123UD' AND s.stop_order = 10)
  OR   (b.bus_number = '308Z' AND s.stop_order = 0)
  OR   (b.bus_number = '308Z' AND s.stop_order = 1)
  OR   (b.bus_number = '308AB' AND s.stop_order = 0)
  OR   (b.bus_number = '308AB' AND s.stop_order = 1)
  OR   (b.bus_number = '308J' AND s.stop_order = 0)
  OR   (b.bus_number = '308J' AND s.stop_order = 1)
  OR   (b.bus_number = '501G' AND s.stop_order = 0)
  OR   (b.bus_number = '501G' AND s.stop_order = 1)
  OR   (b.bus_number = '123AC' AND s.stop_order = 0)
  OR   (b.bus_number = '123AC' AND s.stop_order = 1)
  OR   (b.bus_number = '123AC' AND s.stop_order = 2)
  OR   (b.bus_number = '501AJ' AND s.stop_order = 0)
  OR   (b.bus_number = '501AJ' AND s.stop_order = 1)
  OR   (b.bus_number = '503A' AND s.stop_order = 0)
  OR   (b.bus_number = '503A' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 0)
  OR   (b.bus_number = '123MS' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 2)
  OR   (b.bus_number = '511A' AND s.stop_order = 0)
  OR   (b.bus_number = '511A' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 0)
  OR   (b.bus_number = '123NS' AND s.stop_order = 1)
  OR   (b.bus_number = '123NS' AND s.stop_order = 2)
  OR   (b.bus_number = '123NS' AND s.stop_order = 3)
  OR   (b.bus_number = '123NS' AND s.stop_order = 4)
  OR   (b.bus_number = '123NS' AND s.stop_order = 5)
  OR   (b.bus_number = '123NS' AND s.stop_order = 6)
  OR   (b.bus_number = '123NS' AND s.stop_order = 7)
  OR   (b.bus_number = '123NS' AND s.stop_order = 8)
  OR   (b.bus_number = '123NS' AND s.stop_order = 9)
  OR   (b.bus_number = '123NS' AND s.stop_order = 10)
  OR   (b.bus_number = '308A' AND s.stop_order = 0)
  OR   (b.bus_number = '308A' AND s.stop_order = 1)
  OR   (b.bus_number = '502B' AND s.stop_order = 0)
  OR   (b.bus_number = '502B' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '308AE' AND s.stop_order = 0)
  OR   (b.bus_number = '308AE' AND s.stop_order = 1)
  OR   (b.bus_number = '308AC' AND s.stop_order = 0)
  OR   (b.bus_number = '308AC' AND s.stop_order = 1)
  OR   (b.bus_number = '182B' AND s.stop_order = 0)
  OR   (b.bus_number = '182B' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '308M' AND s.stop_order = 0)
  OR   (b.bus_number = '308M' AND s.stop_order = 1)
  OR   (b.bus_number = '308S' AND s.stop_order = 0)
  OR   (b.bus_number = '308S' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '308N' AND s.stop_order = 0)
  OR   (b.bus_number = '308N' AND s.stop_order = 1)
  OR   (b.bus_number = '308Y' AND s.stop_order = 0)
  OR   (b.bus_number = '308Y' AND s.stop_order = 1)
  OR   (b.bus_number = '308P' AND s.stop_order = 0)
  OR   (b.bus_number = '308P' AND s.stop_order = 1)
  OR   (b.bus_number = '308Z' AND s.stop_order = 0)
  OR   (b.bus_number = '308Z' AND s.stop_order = 1)
  OR   (b.bus_number = '308H' AND s.stop_order = 0)
  OR   (b.bus_number = '308H' AND s.stop_order = 1)
  OR   (b.bus_number = '308R' AND s.stop_order = 0)
  OR   (b.bus_number = '308R' AND s.stop_order = 1)
  OR   (b.bus_number = '501AB' AND s.stop_order = 0)
  OR   (b.bus_number = '501AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AL' AND s.stop_order = 0)
  OR   (b.bus_number = '123AL' AND s.stop_order = 1)
  OR   (b.bus_number = '123AL' AND s.stop_order = 2)
  OR   (b.bus_number = '123AL' AND s.stop_order = 3)
  OR   (b.bus_number = '123AL' AND s.stop_order = 4)
  OR   (b.bus_number = '123AL' AND s.stop_order = 5)
  OR   (b.bus_number = '123AL' AND s.stop_order = 6)
  OR   (b.bus_number = '123AL' AND s.stop_order = 7)
  OR   (b.bus_number = '123AL' AND s.stop_order = 8)
  OR   (b.bus_number = '123AL' AND s.stop_order = 9)
  OR   (b.bus_number = '123AL' AND s.stop_order = 10)
  OR   (b.bus_number = '308AD' AND s.stop_order = 0)
  OR   (b.bus_number = '308AD' AND s.stop_order = 1)
  OR   (b.bus_number = '308G' AND s.stop_order = 0)
  OR   (b.bus_number = '308G' AND s.stop_order = 1)
  OR   (b.bus_number = '308I' AND s.stop_order = 0)
  OR   (b.bus_number = '308I' AND s.stop_order = 1)
  OR   (b.bus_number = '308AA' AND s.stop_order = 0)
  OR   (b.bus_number = '308AA' AND s.stop_order = 1)
  OR   (b.bus_number = '308P' AND s.stop_order = 0)
  OR   (b.bus_number = '308P' AND s.stop_order = 1)
  OR   (b.bus_number = '308AG' AND s.stop_order = 0)
  OR   (b.bus_number = '308AG' AND s.stop_order = 1)
  OR   (b.bus_number = '308X' AND s.stop_order = 0)
  OR   (b.bus_number = '308X' AND s.stop_order = 1)
  OR   (b.bus_number = '182D' AND s.stop_order = 0)
  OR   (b.bus_number = '182D' AND s.stop_order = 1)
  OR   (b.bus_number = '308AF' AND s.stop_order = 0)
  OR   (b.bus_number = '308AF' AND s.stop_order = 1)
  OR   (b.bus_number = '308F' AND s.stop_order = 0)
  OR   (b.bus_number = '308F' AND s.stop_order = 1)
  OR   (b.bus_number = '182C' AND s.stop_order = 0)
  OR   (b.bus_number = '182C' AND s.stop_order = 1)
  OR   (b.bus_number = '308U' AND s.stop_order = 0)
  OR   (b.bus_number = '308U' AND s.stop_order = 1)
  OR   (b.bus_number = '501R' AND s.stop_order = 0)
  OR   (b.bus_number = '501R' AND s.stop_order = 1)
  OR   (b.bus_number = '506B' AND s.stop_order = 0)
  OR   (b.bus_number = '506B' AND s.stop_order = 1)
  OR   (b.bus_number = '510C' AND s.stop_order = 0)
  OR   (b.bus_number = '510C' AND s.stop_order = 1)
  OR   (b.bus_number = '501AD' AND s.stop_order = 0)
  OR   (b.bus_number = '501AD' AND s.stop_order = 1)
  OR   (b.bus_number = '505A' AND s.stop_order = 0)
  OR   (b.bus_number = '505A' AND s.stop_order = 1)
  OR   (b.bus_number = '508J' AND s.stop_order = 0)
  OR   (b.bus_number = '508J' AND s.stop_order = 1)
  OR   (b.bus_number = '510D' AND s.stop_order = 0)
  OR   (b.bus_number = '510D' AND s.stop_order = 1)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 0)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 2)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 4)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 6)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 7)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 8)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 9)
  OR   (b.bus_number = '123KUD' AND s.stop_order = 11)
  OR   (b.bus_number = '123UD' AND s.stop_order = 0)
  OR   (b.bus_number = '123UD' AND s.stop_order = 1)
  OR   (b.bus_number = '123UD' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 9)
  OR   (b.bus_number = '123AB' AND s.stop_order = 10)
  OR   (b.bus_number = '511B' AND s.stop_order = 0)
  OR   (b.bus_number = '511B' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 0)
  OR   (b.bus_number = '123LB' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 2)
  OR   (b.bus_number = '123LB' AND s.stop_order = 3)
  OR   (b.bus_number = '123LB' AND s.stop_order = 4)
  OR   (b.bus_number = '123LB' AND s.stop_order = 5)
  OR   (b.bus_number = '123LB' AND s.stop_order = 6)
  OR   (b.bus_number = '123LB' AND s.stop_order = 7)
  OR   (b.bus_number = '123LB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 6)
  OR   (b.bus_number = '123AB' AND s.stop_order = 7)
  OR   (b.bus_number = '123AB' AND s.stop_order = 8)
  OR   (b.bus_number = '123LB' AND s.stop_order = 0)
  OR   (b.bus_number = '123LB' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 2)
  OR   (b.bus_number = '123LB' AND s.stop_order = 3)
  OR   (b.bus_number = '123LB' AND s.stop_order = 4)
  OR   (b.bus_number = '123LB' AND s.stop_order = 5)
  OR   (b.bus_number = '123LB' AND s.stop_order = 6)
  OR   (b.bus_number = '123LB' AND s.stop_order = 7)
  OR   (b.bus_number = '123LB' AND s.stop_order = 8)
  OR   (b.bus_number = '123MS' AND s.stop_order = 0)
  OR   (b.bus_number = '123MS' AND s.stop_order = 1)
  OR   (b.bus_number = '123MS' AND s.stop_order = 2)
  OR   (b.bus_number = '506H' AND s.stop_order = 0)
  OR   (b.bus_number = '506H' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '123AB' AND s.stop_order = 5)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 3)
  OR   (b.bus_number = '123AB' AND s.stop_order = 4)
  OR   (b.bus_number = '501AC' AND s.stop_order = 0)
  OR   (b.bus_number = '501AC' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 0)
  OR   (b.bus_number = '123LB' AND s.stop_order = 1)
  OR   (b.bus_number = '123LB' AND s.stop_order = 2)
  OR   (b.bus_number = '123LB' AND s.stop_order = 3)
  OR   (b.bus_number = '123LB' AND s.stop_order = 4)
  OR   (b.bus_number = '508D' AND s.stop_order = 0)
  OR   (b.bus_number = '508D' AND s.stop_order = 1)
  OR   (b.bus_number = '123AL' AND s.stop_order = 0)
  OR   (b.bus_number = '123AL' AND s.stop_order = 1)
  OR   (b.bus_number = '123AL' AND s.stop_order = 2)
  OR   (b.bus_number = '123AL' AND s.stop_order = 3)
  OR   (b.bus_number = '123AL' AND s.stop_order = 4)
  OR   (b.bus_number = '123AL' AND s.stop_order = 5)
  OR   (b.bus_number = '123AL' AND s.stop_order = 6)
  OR   (b.bus_number = '123AL' AND s.stop_order = 7)
  OR   (b.bus_number = '123AL' AND s.stop_order = 8)
  OR   (b.bus_number = '123AL' AND s.stop_order = 9)
  OR   (b.bus_number = '123AL' AND s.stop_order = 10)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '123AB' AND s.stop_order = 0)
  OR   (b.bus_number = '123AB' AND s.stop_order = 1)
  OR   (b.bus_number = '123AB' AND s.stop_order = 2)
  OR   (b.bus_number = '133UD' AND s.stop_order = 0)
  OR   (b.bus_number = '133UD' AND s.stop_order = 1)
  OR   (b.bus_number = '133UD' AND s.stop_order = 2)
  OR   (b.bus_number = '133UD' AND s.stop_order = 3)
  OR   (b.bus_number = '133UD' AND s.stop_order = 4)
  OR   (b.bus_number = '133UD' AND s.stop_order = 5)
  OR   (b.bus_number = '133UD' AND s.stop_order = 6)
  OR   (b.bus_number = '133UD' AND s.stop_order = 7)
  OR   (b.bus_number = '133UD' AND s.stop_order = 8)
  OR   (b.bus_number = '133UD' AND s.stop_order = 0)
  OR   (b.bus_number = '133UD' AND s.stop_order = 1)
  OR   (b.bus_number = '133UD' AND s.stop_order = 2)
  OR   (b.bus_number = '133UD' AND s.stop_order = 3)
  OR   (b.bus_number = '133UD' AND s.stop_order = 4)
  OR   (b.bus_number = '133UD' AND s.stop_order = 5)
  OR   (b.bus_number = '133UD' AND s.stop_order = 6)
  OR   (b.bus_number = '133UD' AND s.stop_order = 7)
  OR   (b.bus_number = '133UD' AND s.stop_order = 8)
  OR   (b.bus_number = '422UD' AND s.stop_order = 0)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 2)
  OR   (b.bus_number = '422UD' AND s.stop_order = 3)
  OR   (b.bus_number = '422UD' AND s.stop_order = 4)
  OR   (b.bus_number = '422UD' AND s.stop_order = 5)
  OR   (b.bus_number = '422UD' AND s.stop_order = 6)
  OR   (b.bus_number = '422UD' AND s.stop_order = 7)
  OR   (b.bus_number = '422UD' AND s.stop_order = 8)
  OR   (b.bus_number = '422UD' AND s.stop_order = 0)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 2)
  OR   (b.bus_number = '422UD' AND s.stop_order = 3)
  OR   (b.bus_number = '422UD' AND s.stop_order = 4)
  OR   (b.bus_number = '422UD' AND s.stop_order = 5)
  OR   (b.bus_number = '422UD' AND s.stop_order = 6)
  OR   (b.bus_number = '422UD' AND s.stop_order = 7)
  OR   (b.bus_number = '422UD' AND s.stop_order = 8)
  OR   (b.bus_number = '026P' AND s.stop_order = 0)
  OR   (b.bus_number = '026P' AND s.stop_order = 1)
  OR   (b.bus_number = '144A2' AND s.stop_order = 0)
  OR   (b.bus_number = '144A2' AND s.stop_order = 1)
  OR   (b.bus_number = '146I1' AND s.stop_order = 0)
  OR   (b.bus_number = '146I1' AND s.stop_order = 1)
  OR   (b.bus_number = '015C' AND s.stop_order = 0)
  OR   (b.bus_number = '015C' AND s.stop_order = 1)
  OR   (b.bus_number = '161B2' AND s.stop_order = 0)
  OR   (b.bus_number = '161B2' AND s.stop_order = 1)
  OR   (b.bus_number = '636UD' AND s.stop_order = 1)
  OR   (b.bus_number = '636UD' AND s.stop_order = 2)
  OR   (b.bus_number = '142A2' AND s.stop_order = 0)
  OR   (b.bus_number = '142A2' AND s.stop_order = 1)
  OR   (b.bus_number = '131CA1' AND s.stop_order = 0)
  OR   (b.bus_number = '131CA1' AND s.stop_order = 1)
  OR   (b.bus_number = '785UD' AND s.stop_order = 1)
  OR   (b.bus_number = '785UD' AND s.stop_order = 2)
  OR   (b.bus_number = '785UD' AND s.stop_order = 4)
  OR   (b.bus_number = '636UD' AND s.stop_order = 0)
  OR   (b.bus_number = '636UD' AND s.stop_order = 1)
  OR   (b.bus_number = '636UD' AND s.stop_order = 2)
  OR   (b.bus_number = '636UD' AND s.stop_order = 3)
  OR   (b.bus_number = '636UD' AND s.stop_order = 4)
  OR   (b.bus_number = '144A2' AND s.stop_order = 0)
  OR   (b.bus_number = '144A2' AND s.stop_order = 1)
  OR   (b.bus_number = '863D' AND s.stop_order = 0)
  OR   (b.bus_number = '863A' AND s.stop_order = 0)
  OR   (b.bus_number = '863C' AND s.stop_order = 0)
  OR   (b.bus_number = '722UD' AND s.stop_order = 1)
  OR   (b.bus_number = '722UD' AND s.stop_order = 2)
  OR   (b.bus_number = '722UD' AND s.stop_order = 5)
  OR   (b.bus_number = '866C' AND s.stop_order = 0)
  OR   (b.bus_number = '863B' AND s.stop_order = 0)
  OR   (b.bus_number = '962TNS' AND s.stop_order = 0)
  OR   (b.bus_number = '962TNS' AND s.stop_order = 1)
  OR   (b.bus_number = '962TNS' AND s.stop_order = 2)
  OR   (b.bus_number = '787UD' AND s.stop_order = 0)
  OR   (b.bus_number = '787UD' AND s.stop_order = 1)
  OR   (b.bus_number = '787UD' AND s.stop_order = 2)
  OR   (b.bus_number = '787UD' AND s.stop_order = 4)
  OR   (b.bus_number = '787UD' AND s.stop_order = 5)
  OR   (b.bus_number = '962AB' AND s.stop_order = 0)
  OR   (b.bus_number = '962AB' AND s.stop_order = 1)
  OR   (b.bus_number = '962AB' AND s.stop_order = 2)
);

-- Chunk 6/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '962AB' AND s.stop_order = 5 THEN 'CHITT0OR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '962AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '962AB' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '962AB' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '962AB' AND s.stop_order = 3 THEN 'BHAVANI BYE PASS'
    WHEN b.bus_number = '962AB' AND s.stop_order = 5 THEN 'CHITT0OR'
    WHEN b.bus_number = '841AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '841AC' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '841AC' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '841UD' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '841UD' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '841UD' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '772UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI'
    WHEN b.bus_number = '772UD' AND s.stop_order = 6 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '888NS' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '888NS' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '888NS' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '888NS' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '888NS' AND s.stop_order = 7 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 0 THEN 'MERCARA'
    WHEN b.bus_number = '897LB' AND s.stop_order = 8 THEN 'VEDASENDUR BYPASS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 9 THEN 'DINDIGUL PALANI BYPASS'
    WHEN b.bus_number = '897LB' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '1054A' AND s.stop_order = 0 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '1054A' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '996NS' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '996NS' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '874HUD' AND s.stop_order = 3 THEN 'NAMAKKAL'
    WHEN b.bus_number = '874HUD' AND s.stop_order = 4 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 4 THEN 'HOSUR'
    WHEN b.bus_number = '844TAB' AND s.stop_order = 7 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '990UD' AND s.stop_order = 2 THEN 'KADAYANALLUR'
    WHEN b.bus_number = '990UD' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '990UD' AND s.stop_order = 4 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '990UD' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '985NS' AND s.stop_order = 1 THEN 'ARUPPUKOTTAI BYPASS'
    WHEN b.bus_number = '985NS' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '985NS' AND s.stop_order = 3 THEN 'MELUR BS'
    WHEN b.bus_number = '981NS' AND s.stop_order = 1 THEN 'SPIC NAGAR'
    WHEN b.bus_number = '981NS' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '966UD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '966UD' AND s.stop_order = 2 THEN 'CHITT0OR'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 4 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 6 THEN 'TRICHY KKBT'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 9 THEN 'CHITT0OR'
    WHEN b.bus_number = '983UD' AND s.stop_order = 1 THEN 'VEERAVANALLUR PS BYPASS'
    WHEN b.bus_number = '983UD' AND s.stop_order = 3 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '983UD' AND s.stop_order = 4 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '983UD' AND s.stop_order = 5 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '983UD' AND s.stop_order = 6 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '983UD' AND s.stop_order = 8 THEN 'SATTUR'
    WHEN b.bus_number = '983UD' AND s.stop_order = 9 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = '983UD' AND s.stop_order = 10 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '984UD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '984UD' AND s.stop_order = 2 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '984UD' AND s.stop_order = 3 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '984UD' AND s.stop_order = 4 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '984UD' AND s.stop_order = 6 THEN 'SATTUR'
    WHEN b.bus_number = '984UD' AND s.stop_order = 7 THEN 'VIRUDHUNAGAR'
    WHEN b.bus_number = '984UD' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '984UD' AND s.stop_order = 9 THEN 'THIRUVANNAMALAI'
    WHEN b.bus_number = '984UD' AND s.stop_order = 11 THEN 'CHITT0OR'
    WHEN b.bus_number = '283NS' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 1 THEN 'THENKASI'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 2 THEN 'KADAYA NALLUR'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 4 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '297LB' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '297LB' AND s.stop_order = 3 THEN 'VALLIYOOR'
    WHEN b.bus_number = '297LB' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '360A' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '239A1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '239B1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '360B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '360C' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '39202' AND s.stop_order = 1 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '668UD' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '668UD' AND s.stop_order = 3 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '668UD' AND s.stop_order = 4 THEN 'VALLIYOOR'
    WHEN b.bus_number = '505DLXC' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXA' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505J1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXD' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505R' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXB' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505Q' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505S' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505E2' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '995UD' AND s.stop_order = 1 THEN 'VADACHERRY'
    WHEN b.bus_number = '995UD' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '995UD' AND s.stop_order = 3 THEN 'VALLIYOOR'
    WHEN b.bus_number = '995UD' AND s.stop_order = 6 THEN 'SATTUR'
    WHEN b.bus_number = '995UD' AND s.stop_order = 7 THEN 'VIRUDHUNAGAR COLLECTOR OFFICE'
    WHEN b.bus_number = '995UD' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '504G1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505M1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '531UD' AND s.stop_order = 1 THEN 'VALLIYOOR'
    WHEN b.bus_number = '531UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '531UD' AND s.stop_order = 6 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '531MUD' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '531MUD' AND s.stop_order = 7 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '505A1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505E1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505A3' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 4 THEN 'VIRUDHACHALAM BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 7 THEN 'PERAMBALUR X ROAD'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 9 THEN 'ARUPPUKOTTAI BYPASS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 4 THEN 'VIRUDHACHALAM BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 7 THEN 'PERAMBALUR X ROAD'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 8 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 9 THEN 'ARUPPUKOTTAI BYPASS'
    WHEN b.bus_number = '180I' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '181B' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '380A' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180J' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '880A' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '104B1' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180M' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '680D' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '480A' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '680B' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '380B' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '780A' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180O' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180P' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180V' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '780B' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '180T' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '104B1' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '871HUD' AND s.stop_order = 2 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '798A' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '151' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '575A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '575C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '575A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '966UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '966UD' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '304M' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304T' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304Q' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304U' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304F' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304V' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304G' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304N' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304H' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304I' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '305A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304J' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304O' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '307B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304K' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304P' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '850AC' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 4 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 5 THEN 'PERAMBALUR'
    WHEN b.bus_number = '850AC' AND s.stop_order = 7 THEN 'CHITT0OR'
    WHEN b.bus_number = '304C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304R' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850UD' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '850UD' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '850UD' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '850UD' AND s.stop_order = 4 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '850UD' AND s.stop_order = 5 THEN 'PERAMBALUR'
    WHEN b.bus_number = '850UD' AND s.stop_order = 7 THEN 'CHITT0OR'
    WHEN b.bus_number = '969UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACA' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '850AC' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 4 THEN 'SAMAYAPURAM TOLL GATE'
    WHEN b.bus_number = '850AC' AND s.stop_order = 5 THEN 'PERAMBALUR'
    WHEN b.bus_number = '850AC' AND s.stop_order = 7 THEN 'CHITT0OR'
    WHEN b.bus_number = '304E' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304S' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304L' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '307A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '283NS' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 1 THEN 'CHITT0OR'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = 'V995AB' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '795NS' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '297LB' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '996NS' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '985NS' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '985NS' AND s.stop_order = 4 THEN 'ARUPPUKOTTAI BYPASS'
    WHEN b.bus_number = '990UD' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '990UD' AND s.stop_order = 5 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '990UD' AND s.stop_order = 6 THEN 'KADAYANALLUR'
    WHEN b.bus_number = '984UD' AND s.stop_order = 1 THEN 'CHITT0OR'
    WHEN b.bus_number = '984UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '990VUD' AND s.stop_order = 3 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '983UD' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '981NS' AND s.stop_order = 3 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '841UD' AND s.stop_order = 1 THEN 'VILLIYANUR BYPASS'
    WHEN b.bus_number = '841UD' AND s.stop_order = 2 THEN 'MANAKULA VINAYAGAR  COLLEGE'
    WHEN b.bus_number = '841UD' AND s.stop_order = 3 THEN 'VALAVANUR'
    WHEN b.bus_number = '360B' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '360C' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '239A1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847UD' AND s.stop_order = 1 THEN 'MANAKULA VINAYAGAR  COLLEGE'
    WHEN b.bus_number = '847UD' AND s.stop_order = 2 THEN 'VALAVANUR'
    WHEN b.bus_number = '847UD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '360A' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '239B1' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '282' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '282' AND s.stop_order = 1 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '282' AND s.stop_order = 2 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '282' AND s.stop_order = 3 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '282' AND s.stop_order = 4 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '282' AND s.stop_order = 5 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '282' AND s.stop_order = 6 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '282' AND s.stop_order = 7 THEN 'TINDIVANAM'
    WHEN b.bus_number = '282UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '282UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '282UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '282UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '282UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '282UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '282UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '282UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '282UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '282UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '282UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '433UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '433UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '433UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '433UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '433UD' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '433UD' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '433UD' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '433UD' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '433UD' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '433UD' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '433UD' AND s.stop_order = 10 THEN 'THURAIYUR'
    WHEN b.bus_number = '429UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '429UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '429UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '429UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '429UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '429UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '429UD' AND s.stop_order = 9 THEN 'THURAIYUR'
    WHEN b.bus_number = '100UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '429UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '429UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '429UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '429UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '429UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '429UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '429UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '281J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175U' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '975B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281T' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '175G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '875C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '875A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '281A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '281E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '275B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '375B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '775B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175S' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '575D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '281C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '175M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281S' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AW' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '281AK' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175O' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175V' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AT' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AN' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175Q' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '969A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '875B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '275A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '775A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '575B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '175F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '475B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '375A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '475C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AL' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AL' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AL' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AL' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422AL' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AO' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422MS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422MS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422MS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422MS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422MS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422MS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '422MS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '422MS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '422UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '422UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '281Q' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '422AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '422AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '281L' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281R' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '422AB' AND s.stop_order = 1 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '422AB' AND s.stop_order = 2 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '422NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '245J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '340KAB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '340KAB' AND s.stop_order = 1 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '838AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838AB' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838AB' AND s.stop_order = 9 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 10 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838AB' AND s.stop_order = 11 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838AB' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838AB' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838AB' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '962AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '962AB' AND s.stop_order = 0)
  OR   (b.bus_number = '962AB' AND s.stop_order = 1)
  OR   (b.bus_number = '962AB' AND s.stop_order = 2)
  OR   (b.bus_number = '962AB' AND s.stop_order = 3)
  OR   (b.bus_number = '962AB' AND s.stop_order = 5)
  OR   (b.bus_number = '841AC' AND s.stop_order = 0)
  OR   (b.bus_number = '841AC' AND s.stop_order = 1)
  OR   (b.bus_number = '841AC' AND s.stop_order = 2)
  OR   (b.bus_number = '841UD' AND s.stop_order = 0)
  OR   (b.bus_number = '841UD' AND s.stop_order = 1)
  OR   (b.bus_number = '841UD' AND s.stop_order = 2)
  OR   (b.bus_number = '772UD' AND s.stop_order = 4)
  OR   (b.bus_number = '772UD' AND s.stop_order = 6)
  OR   (b.bus_number = '888NS' AND s.stop_order = 0)
  OR   (b.bus_number = '888NS' AND s.stop_order = 1)
  OR   (b.bus_number = '888NS' AND s.stop_order = 2)
  OR   (b.bus_number = '888NS' AND s.stop_order = 3)
  OR   (b.bus_number = '888NS' AND s.stop_order = 7)
  OR   (b.bus_number = '897LB' AND s.stop_order = 0)
  OR   (b.bus_number = '897LB' AND s.stop_order = 8)
  OR   (b.bus_number = '897LB' AND s.stop_order = 9)
  OR   (b.bus_number = '897LB' AND s.stop_order = 10)
  OR   (b.bus_number = '1054A' AND s.stop_order = 0)
  OR   (b.bus_number = '1054A' AND s.stop_order = 1)
  OR   (b.bus_number = '996NS' AND s.stop_order = 2)
  OR   (b.bus_number = '996NS' AND s.stop_order = 4)
  OR   (b.bus_number = '874HUD' AND s.stop_order = 3)
  OR   (b.bus_number = '874HUD' AND s.stop_order = 4)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 0)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 1)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 2)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 3)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 4)
  OR   (b.bus_number = '844TAB' AND s.stop_order = 7)
  OR   (b.bus_number = '990UD' AND s.stop_order = 2)
  OR   (b.bus_number = '990UD' AND s.stop_order = 3)
  OR   (b.bus_number = '990UD' AND s.stop_order = 4)
  OR   (b.bus_number = '990UD' AND s.stop_order = 6)
  OR   (b.bus_number = '985NS' AND s.stop_order = 1)
  OR   (b.bus_number = '985NS' AND s.stop_order = 2)
  OR   (b.bus_number = '985NS' AND s.stop_order = 3)
  OR   (b.bus_number = '981NS' AND s.stop_order = 1)
  OR   (b.bus_number = '981NS' AND s.stop_order = 3)
  OR   (b.bus_number = '966UD' AND s.stop_order = 0)
  OR   (b.bus_number = '966UD' AND s.stop_order = 2)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 4)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 5)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 6)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 9)
  OR   (b.bus_number = '983UD' AND s.stop_order = 1)
  OR   (b.bus_number = '983UD' AND s.stop_order = 3)
  OR   (b.bus_number = '983UD' AND s.stop_order = 4)
  OR   (b.bus_number = '983UD' AND s.stop_order = 5)
  OR   (b.bus_number = '983UD' AND s.stop_order = 6)
  OR   (b.bus_number = '983UD' AND s.stop_order = 8)
  OR   (b.bus_number = '983UD' AND s.stop_order = 9)
  OR   (b.bus_number = '983UD' AND s.stop_order = 10)
  OR   (b.bus_number = '984UD' AND s.stop_order = 1)
  OR   (b.bus_number = '984UD' AND s.stop_order = 2)
  OR   (b.bus_number = '984UD' AND s.stop_order = 3)
  OR   (b.bus_number = '984UD' AND s.stop_order = 4)
  OR   (b.bus_number = '984UD' AND s.stop_order = 6)
  OR   (b.bus_number = '984UD' AND s.stop_order = 7)
  OR   (b.bus_number = '984UD' AND s.stop_order = 8)
  OR   (b.bus_number = '984UD' AND s.stop_order = 9)
  OR   (b.bus_number = '984UD' AND s.stop_order = 11)
  OR   (b.bus_number = '283NS' AND s.stop_order = 4)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 1)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 2)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 3)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 4)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 5)
  OR   (b.bus_number = '297LB' AND s.stop_order = 1)
  OR   (b.bus_number = '297LB' AND s.stop_order = 3)
  OR   (b.bus_number = '297LB' AND s.stop_order = 5)
  OR   (b.bus_number = '360A' AND s.stop_order = 0)
  OR   (b.bus_number = '239A1' AND s.stop_order = 0)
  OR   (b.bus_number = '239B1' AND s.stop_order = 0)
  OR   (b.bus_number = '360B' AND s.stop_order = 0)
  OR   (b.bus_number = '360C' AND s.stop_order = 0)
  OR   (b.bus_number = '39202' AND s.stop_order = 1)
  OR   (b.bus_number = '668UD' AND s.stop_order = 1)
  OR   (b.bus_number = '668UD' AND s.stop_order = 3)
  OR   (b.bus_number = '668UD' AND s.stop_order = 4)
  OR   (b.bus_number = '505DLXC' AND s.stop_order = 1)
  OR   (b.bus_number = '505DLXA' AND s.stop_order = 1)
  OR   (b.bus_number = '505J1' AND s.stop_order = 1)
  OR   (b.bus_number = '505DLXD' AND s.stop_order = 1)
  OR   (b.bus_number = '505R' AND s.stop_order = 1)
  OR   (b.bus_number = '505DLXB' AND s.stop_order = 1)
  OR   (b.bus_number = '505Q' AND s.stop_order = 1)
  OR   (b.bus_number = '505S' AND s.stop_order = 1)
  OR   (b.bus_number = '505E2' AND s.stop_order = 1)
  OR   (b.bus_number = '995UD' AND s.stop_order = 1)
  OR   (b.bus_number = '995UD' AND s.stop_order = 2)
  OR   (b.bus_number = '995UD' AND s.stop_order = 3)
  OR   (b.bus_number = '995UD' AND s.stop_order = 6)
  OR   (b.bus_number = '995UD' AND s.stop_order = 7)
  OR   (b.bus_number = '995UD' AND s.stop_order = 8)
  OR   (b.bus_number = '504G1' AND s.stop_order = 1)
  OR   (b.bus_number = '505M1' AND s.stop_order = 1)
  OR   (b.bus_number = '531UD' AND s.stop_order = 1)
  OR   (b.bus_number = '531UD' AND s.stop_order = 4)
  OR   (b.bus_number = '531UD' AND s.stop_order = 6)
  OR   (b.bus_number = '531MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '531MUD' AND s.stop_order = 7)
  OR   (b.bus_number = '505A1' AND s.stop_order = 1)
  OR   (b.bus_number = '505E1' AND s.stop_order = 1)
  OR   (b.bus_number = '505A3' AND s.stop_order = 1)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 7)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 8)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 9)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 7)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 8)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 9)
  OR   (b.bus_number = '180I' AND s.stop_order = 1)
  OR   (b.bus_number = '181B' AND s.stop_order = 1)
  OR   (b.bus_number = '380A' AND s.stop_order = 1)
  OR   (b.bus_number = '180J' AND s.stop_order = 1)
  OR   (b.bus_number = '880A' AND s.stop_order = 1)
  OR   (b.bus_number = '104B1' AND s.stop_order = 1)
  OR   (b.bus_number = '180M' AND s.stop_order = 1)
  OR   (b.bus_number = '680D' AND s.stop_order = 1)
  OR   (b.bus_number = '480A' AND s.stop_order = 1)
  OR   (b.bus_number = '680B' AND s.stop_order = 1)
  OR   (b.bus_number = '380B' AND s.stop_order = 1)
  OR   (b.bus_number = '780A' AND s.stop_order = 1)
  OR   (b.bus_number = '180O' AND s.stop_order = 1)
  OR   (b.bus_number = '180P' AND s.stop_order = 1)
  OR   (b.bus_number = '180V' AND s.stop_order = 1)
  OR   (b.bus_number = '780B' AND s.stop_order = 1)
  OR   (b.bus_number = '180T' AND s.stop_order = 1)
  OR   (b.bus_number = '104B1' AND s.stop_order = 1)
  OR   (b.bus_number = '871HUD' AND s.stop_order = 2)
  OR   (b.bus_number = '798A' AND s.stop_order = 0)
  OR   (b.bus_number = '151' AND s.stop_order = 0)
  OR   (b.bus_number = '575A' AND s.stop_order = 0)
  OR   (b.bus_number = '575C' AND s.stop_order = 0)
  OR   (b.bus_number = '575A' AND s.stop_order = 0)
  OR   (b.bus_number = '966UD' AND s.stop_order = 2)
  OR   (b.bus_number = '966UD' AND s.stop_order = 3)
  OR   (b.bus_number = '304M' AND s.stop_order = 0)
  OR   (b.bus_number = '304T' AND s.stop_order = 0)
  OR   (b.bus_number = '304Q' AND s.stop_order = 0)
  OR   (b.bus_number = '304U' AND s.stop_order = 0)
  OR   (b.bus_number = '304F' AND s.stop_order = 0)
  OR   (b.bus_number = '304V' AND s.stop_order = 0)
  OR   (b.bus_number = '304G' AND s.stop_order = 0)
  OR   (b.bus_number = '304ACB' AND s.stop_order = 0)
  OR   (b.bus_number = '304N' AND s.stop_order = 0)
  OR   (b.bus_number = '304H' AND s.stop_order = 0)
  OR   (b.bus_number = '304ACC' AND s.stop_order = 0)
  OR   (b.bus_number = '304I' AND s.stop_order = 0)
  OR   (b.bus_number = '305A' AND s.stop_order = 0)
  OR   (b.bus_number = '304A' AND s.stop_order = 0)
  OR   (b.bus_number = '304J' AND s.stop_order = 0)
  OR   (b.bus_number = '304O' AND s.stop_order = 0)
  OR   (b.bus_number = '304B' AND s.stop_order = 0)
  OR   (b.bus_number = '307B' AND s.stop_order = 0)
  OR   (b.bus_number = '304K' AND s.stop_order = 0)
  OR   (b.bus_number = '304P' AND s.stop_order = 0)
  OR   (b.bus_number = '850AC' AND s.stop_order = 0)
  OR   (b.bus_number = '850AC' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 2)
  OR   (b.bus_number = '850AC' AND s.stop_order = 3)
  OR   (b.bus_number = '850AC' AND s.stop_order = 4)
  OR   (b.bus_number = '850AC' AND s.stop_order = 5)
  OR   (b.bus_number = '850AC' AND s.stop_order = 7)
  OR   (b.bus_number = '304C' AND s.stop_order = 0)
  OR   (b.bus_number = '304R' AND s.stop_order = 0)
  OR   (b.bus_number = '850UD' AND s.stop_order = 0)
  OR   (b.bus_number = '850UD' AND s.stop_order = 1)
  OR   (b.bus_number = '850UD' AND s.stop_order = 2)
  OR   (b.bus_number = '850UD' AND s.stop_order = 3)
  OR   (b.bus_number = '850UD' AND s.stop_order = 4)
  OR   (b.bus_number = '850UD' AND s.stop_order = 5)
  OR   (b.bus_number = '850UD' AND s.stop_order = 7)
  OR   (b.bus_number = '969UD' AND s.stop_order = 2)
  OR   (b.bus_number = '304ACA' AND s.stop_order = 0)
  OR   (b.bus_number = '850AC' AND s.stop_order = 0)
  OR   (b.bus_number = '850AC' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 2)
  OR   (b.bus_number = '850AC' AND s.stop_order = 3)
  OR   (b.bus_number = '850AC' AND s.stop_order = 4)
  OR   (b.bus_number = '850AC' AND s.stop_order = 5)
  OR   (b.bus_number = '850AC' AND s.stop_order = 7)
  OR   (b.bus_number = '304E' AND s.stop_order = 0)
  OR   (b.bus_number = '304S' AND s.stop_order = 0)
  OR   (b.bus_number = '304L' AND s.stop_order = 0)
  OR   (b.bus_number = '307A' AND s.stop_order = 0)
  OR   (b.bus_number = '283NS' AND s.stop_order = 2)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 1)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 4)
  OR   (b.bus_number = 'V995AB' AND s.stop_order = 5)
  OR   (b.bus_number = '795NS' AND s.stop_order = 2)
  OR   (b.bus_number = '297LB' AND s.stop_order = 2)
  OR   (b.bus_number = '996NS' AND s.stop_order = 3)
  OR   (b.bus_number = '985NS' AND s.stop_order = 3)
  OR   (b.bus_number = '985NS' AND s.stop_order = 4)
  OR   (b.bus_number = '990UD' AND s.stop_order = 3)
  OR   (b.bus_number = '990UD' AND s.stop_order = 5)
  OR   (b.bus_number = '990UD' AND s.stop_order = 6)
  OR   (b.bus_number = '984UD' AND s.stop_order = 1)
  OR   (b.bus_number = '984UD' AND s.stop_order = 4)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 2)
  OR   (b.bus_number = '990VUD' AND s.stop_order = 3)
  OR   (b.bus_number = '983UD' AND s.stop_order = 2)
  OR   (b.bus_number = '981NS' AND s.stop_order = 3)
  OR   (b.bus_number = '841UD' AND s.stop_order = 1)
  OR   (b.bus_number = '841UD' AND s.stop_order = 2)
  OR   (b.bus_number = '841UD' AND s.stop_order = 3)
  OR   (b.bus_number = '360B' AND s.stop_order = 1)
  OR   (b.bus_number = '360C' AND s.stop_order = 1)
  OR   (b.bus_number = '239A1' AND s.stop_order = 1)
  OR   (b.bus_number = '847UD' AND s.stop_order = 1)
  OR   (b.bus_number = '847UD' AND s.stop_order = 2)
  OR   (b.bus_number = '847UD' AND s.stop_order = 4)
  OR   (b.bus_number = '360A' AND s.stop_order = 1)
  OR   (b.bus_number = '239B1' AND s.stop_order = 1)
  OR   (b.bus_number = '282' AND s.stop_order = 0)
  OR   (b.bus_number = '282' AND s.stop_order = 1)
  OR   (b.bus_number = '282' AND s.stop_order = 2)
  OR   (b.bus_number = '282' AND s.stop_order = 3)
  OR   (b.bus_number = '282' AND s.stop_order = 4)
  OR   (b.bus_number = '282' AND s.stop_order = 5)
  OR   (b.bus_number = '282' AND s.stop_order = 6)
  OR   (b.bus_number = '282' AND s.stop_order = 7)
  OR   (b.bus_number = '282UD' AND s.stop_order = 0)
  OR   (b.bus_number = '282UD' AND s.stop_order = 1)
  OR   (b.bus_number = '282UD' AND s.stop_order = 2)
  OR   (b.bus_number = '282UD' AND s.stop_order = 3)
  OR   (b.bus_number = '282UD' AND s.stop_order = 4)
  OR   (b.bus_number = '282UD' AND s.stop_order = 5)
  OR   (b.bus_number = '282UD' AND s.stop_order = 6)
  OR   (b.bus_number = '282UD' AND s.stop_order = 7)
  OR   (b.bus_number = '282UD' AND s.stop_order = 0)
  OR   (b.bus_number = '282UD' AND s.stop_order = 1)
  OR   (b.bus_number = '282UD' AND s.stop_order = 2)
  OR   (b.bus_number = '282UD' AND s.stop_order = 3)
  OR   (b.bus_number = '282UD' AND s.stop_order = 4)
  OR   (b.bus_number = '282UD' AND s.stop_order = 5)
  OR   (b.bus_number = '282UD' AND s.stop_order = 6)
  OR   (b.bus_number = '282UD' AND s.stop_order = 7)
  OR   (b.bus_number = '433UD' AND s.stop_order = 0)
  OR   (b.bus_number = '433UD' AND s.stop_order = 1)
  OR   (b.bus_number = '433UD' AND s.stop_order = 2)
  OR   (b.bus_number = '433UD' AND s.stop_order = 3)
  OR   (b.bus_number = '433UD' AND s.stop_order = 4)
  OR   (b.bus_number = '433UD' AND s.stop_order = 5)
  OR   (b.bus_number = '433UD' AND s.stop_order = 6)
  OR   (b.bus_number = '433UD' AND s.stop_order = 7)
  OR   (b.bus_number = '433UD' AND s.stop_order = 8)
  OR   (b.bus_number = '433UD' AND s.stop_order = 9)
  OR   (b.bus_number = '433UD' AND s.stop_order = 10)
  OR   (b.bus_number = '429UD' AND s.stop_order = 0)
  OR   (b.bus_number = '429UD' AND s.stop_order = 1)
  OR   (b.bus_number = '429UD' AND s.stop_order = 2)
  OR   (b.bus_number = '429UD' AND s.stop_order = 3)
  OR   (b.bus_number = '429UD' AND s.stop_order = 4)
  OR   (b.bus_number = '429UD' AND s.stop_order = 5)
  OR   (b.bus_number = '429UD' AND s.stop_order = 6)
  OR   (b.bus_number = '429UD' AND s.stop_order = 7)
  OR   (b.bus_number = '429UD' AND s.stop_order = 8)
  OR   (b.bus_number = '429UD' AND s.stop_order = 9)
  OR   (b.bus_number = '100UD' AND s.stop_order = 0)
  OR   (b.bus_number = '429UD' AND s.stop_order = 0)
  OR   (b.bus_number = '429UD' AND s.stop_order = 1)
  OR   (b.bus_number = '429UD' AND s.stop_order = 2)
  OR   (b.bus_number = '429UD' AND s.stop_order = 3)
  OR   (b.bus_number = '429UD' AND s.stop_order = 4)
  OR   (b.bus_number = '429UD' AND s.stop_order = 5)
  OR   (b.bus_number = '429UD' AND s.stop_order = 6)
  OR   (b.bus_number = '429UD' AND s.stop_order = 7)
  OR   (b.bus_number = '429UD' AND s.stop_order = 8)
  OR   (b.bus_number = '281J' AND s.stop_order = 0)
  OR   (b.bus_number = '175U' AND s.stop_order = 0)
  OR   (b.bus_number = '975B' AND s.stop_order = 0)
  OR   (b.bus_number = '281T' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '422NS' AND s.stop_order = 8)
  OR   (b.bus_number = '175G' AND s.stop_order = 0)
  OR   (b.bus_number = '875C' AND s.stop_order = 0)
  OR   (b.bus_number = '875A' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '422NS' AND s.stop_order = 8)
  OR   (b.bus_number = '281A' AND s.stop_order = 0)
  OR   (b.bus_number = '281E' AND s.stop_order = 0)
  OR   (b.bus_number = '281K' AND s.stop_order = 0)
  OR   (b.bus_number = '281B' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '281E' AND s.stop_order = 0)
  OR   (b.bus_number = '275B' AND s.stop_order = 0)
  OR   (b.bus_number = '375B' AND s.stop_order = 0)
  OR   (b.bus_number = '775B' AND s.stop_order = 0)
  OR   (b.bus_number = '475D' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '175I' AND s.stop_order = 0)
  OR   (b.bus_number = '175N' AND s.stop_order = 0)
  OR   (b.bus_number = '175S' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '575D' AND s.stop_order = 0)
  OR   (b.bus_number = '281H' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '422NS' AND s.stop_order = 1)
  OR   (b.bus_number = '422NS' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 3)
  OR   (b.bus_number = '422NS' AND s.stop_order = 4)
  OR   (b.bus_number = '422NS' AND s.stop_order = 5)
  OR   (b.bus_number = '422NS' AND s.stop_order = 6)
  OR   (b.bus_number = '422NS' AND s.stop_order = 7)
  OR   (b.bus_number = '422NS' AND s.stop_order = 8)
  OR   (b.bus_number = '281C' AND s.stop_order = 0)
  OR   (b.bus_number = '281D' AND s.stop_order = 0)
  OR   (b.bus_number = '281N' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '175M' AND s.stop_order = 0)
  OR   (b.bus_number = '281N' AND s.stop_order = 0)
  OR   (b.bus_number = '281F' AND s.stop_order = 0)
  OR   (b.bus_number = '281G' AND s.stop_order = 0)
  OR   (b.bus_number = '281S' AND s.stop_order = 0)
  OR   (b.bus_number = '281AW' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '281AK' AND s.stop_order = 0)
  OR   (b.bus_number = '175O' AND s.stop_order = 0)
  OR   (b.bus_number = '175V' AND s.stop_order = 0)
  OR   (b.bus_number = '281G' AND s.stop_order = 0)
  OR   (b.bus_number = '281AT' AND s.stop_order = 0)
  OR   (b.bus_number = '281M' AND s.stop_order = 0)
  OR   (b.bus_number = '175D' AND s.stop_order = 0)
  OR   (b.bus_number = '281K' AND s.stop_order = 0)
  OR   (b.bus_number = '281M' AND s.stop_order = 0)
  OR   (b.bus_number = '281AN' AND s.stop_order = 0)
  OR   (b.bus_number = '175D' AND s.stop_order = 0)
  OR   (b.bus_number = '175Q' AND s.stop_order = 0)
  OR   (b.bus_number = '969A' AND s.stop_order = 0)
  OR   (b.bus_number = '875B' AND s.stop_order = 0)
  OR   (b.bus_number = '275A' AND s.stop_order = 0)
  OR   (b.bus_number = '575A' AND s.stop_order = 0)
  OR   (b.bus_number = '175E' AND s.stop_order = 0)
  OR   (b.bus_number = '175A' AND s.stop_order = 0)
  OR   (b.bus_number = '422UD' AND s.stop_order = 0)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 2)
  OR   (b.bus_number = '422UD' AND s.stop_order = 3)
  OR   (b.bus_number = '422UD' AND s.stop_order = 4)
  OR   (b.bus_number = '422UD' AND s.stop_order = 5)
  OR   (b.bus_number = '422UD' AND s.stop_order = 6)
  OR   (b.bus_number = '422UD' AND s.stop_order = 7)
  OR   (b.bus_number = '422UD' AND s.stop_order = 8)
  OR   (b.bus_number = '775A' AND s.stop_order = 0)
  OR   (b.bus_number = '575B' AND s.stop_order = 0)
  OR   (b.bus_number = '175F' AND s.stop_order = 0)
  OR   (b.bus_number = '475B' AND s.stop_order = 0)
  OR   (b.bus_number = '375A' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422AB' AND s.stop_order = 8)
  OR   (b.bus_number = '475C' AND s.stop_order = 0)
  OR   (b.bus_number = '422AL' AND s.stop_order = 0)
  OR   (b.bus_number = '422AL' AND s.stop_order = 1)
  OR   (b.bus_number = '422AL' AND s.stop_order = 2)
  OR   (b.bus_number = '422AL' AND s.stop_order = 3)
  OR   (b.bus_number = '422AL' AND s.stop_order = 4)
  OR   (b.bus_number = '422AL' AND s.stop_order = 5)
  OR   (b.bus_number = '422AL' AND s.stop_order = 6)
  OR   (b.bus_number = '422AL' AND s.stop_order = 7)
  OR   (b.bus_number = '422AL' AND s.stop_order = 8)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '281AO' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422AB' AND s.stop_order = 3)
  OR   (b.bus_number = '422AB' AND s.stop_order = 4)
  OR   (b.bus_number = '422AB' AND s.stop_order = 5)
  OR   (b.bus_number = '422AB' AND s.stop_order = 6)
  OR   (b.bus_number = '422AB' AND s.stop_order = 7)
  OR   (b.bus_number = '422MS' AND s.stop_order = 0)
  OR   (b.bus_number = '422MS' AND s.stop_order = 1)
  OR   (b.bus_number = '422MS' AND s.stop_order = 2)
  OR   (b.bus_number = '422MS' AND s.stop_order = 3)
  OR   (b.bus_number = '422MS' AND s.stop_order = 4)
  OR   (b.bus_number = '422MS' AND s.stop_order = 5)
  OR   (b.bus_number = '422MS' AND s.stop_order = 6)
  OR   (b.bus_number = '422MS' AND s.stop_order = 7)
  OR   (b.bus_number = '422MS' AND s.stop_order = 8)
  OR   (b.bus_number = '422UD' AND s.stop_order = 0)
  OR   (b.bus_number = '422UD' AND s.stop_order = 1)
  OR   (b.bus_number = '422UD' AND s.stop_order = 2)
  OR   (b.bus_number = '422UD' AND s.stop_order = 3)
  OR   (b.bus_number = '422UD' AND s.stop_order = 4)
  OR   (b.bus_number = '422UD' AND s.stop_order = 5)
  OR   (b.bus_number = '422UD' AND s.stop_order = 6)
  OR   (b.bus_number = '281Q' AND s.stop_order = 0)
  OR   (b.bus_number = '422AC' AND s.stop_order = 0)
  OR   (b.bus_number = '422AC' AND s.stop_order = 1)
  OR   (b.bus_number = '422AC' AND s.stop_order = 2)
  OR   (b.bus_number = '422AC' AND s.stop_order = 3)
  OR   (b.bus_number = '422AC' AND s.stop_order = 4)
  OR   (b.bus_number = '422AC' AND s.stop_order = 5)
  OR   (b.bus_number = '281L' AND s.stop_order = 0)
  OR   (b.bus_number = '281R' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 0)
  OR   (b.bus_number = '422AB' AND s.stop_order = 1)
  OR   (b.bus_number = '422AB' AND s.stop_order = 2)
  OR   (b.bus_number = '422NS' AND s.stop_order = 0)
  OR   (b.bus_number = '245J' AND s.stop_order = 0)
  OR   (b.bus_number = '340KAB' AND s.stop_order = 0)
  OR   (b.bus_number = '340KAB' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 0)
  OR   (b.bus_number = '838AB' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 2)
  OR   (b.bus_number = '838AB' AND s.stop_order = 3)
  OR   (b.bus_number = '838AB' AND s.stop_order = 4)
  OR   (b.bus_number = '838AB' AND s.stop_order = 5)
  OR   (b.bus_number = '838AB' AND s.stop_order = 6)
  OR   (b.bus_number = '838AB' AND s.stop_order = 7)
  OR   (b.bus_number = '838AB' AND s.stop_order = 8)
  OR   (b.bus_number = '838AB' AND s.stop_order = 9)
  OR   (b.bus_number = '838AB' AND s.stop_order = 10)
  OR   (b.bus_number = '838AB' AND s.stop_order = 11)
  OR   (b.bus_number = '838AB' AND s.stop_order = 0)
  OR   (b.bus_number = '838AB' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 2)
  OR   (b.bus_number = '838AB' AND s.stop_order = 3)
  OR   (b.bus_number = '838AB' AND s.stop_order = 4)
  OR   (b.bus_number = '838AB' AND s.stop_order = 5)
  OR   (b.bus_number = '838AB' AND s.stop_order = 6)
  OR   (b.bus_number = '838AB' AND s.stop_order = 7)
  OR   (b.bus_number = '838AB' AND s.stop_order = 8)
  OR   (b.bus_number = '838AB' AND s.stop_order = 9)
);

-- Chunk 7/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '838AB' AND s.stop_order = 10 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838AC' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838AB' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838AB' AND s.stop_order = 2 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 3 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838AB' AND s.stop_order = 4 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838AB' AND s.stop_order = 5 THEN 'PERUMANALLUR TOLL'
    WHEN b.bus_number = '838AB' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838MS' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838MS' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838MS' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838MS' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838MS' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838MS' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838MS' AND s.stop_order = 6 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838MS' AND s.stop_order = 7 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838MS' AND s.stop_order = 8 THEN 'VIJAYAMANGALAM TOLL'
    WHEN b.bus_number = '838MS' AND s.stop_order = 9 THEN 'BHAVANI BYE PASS LAKSHMI NAGAR'
    WHEN b.bus_number = '838MS' AND s.stop_order = 10 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '838AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '838AC' AND s.stop_order = 1 THEN 'LAKSHMI MILLS'
    WHEN b.bus_number = '838AC' AND s.stop_order = 2 THEN 'PEELAMEDU'
    WHEN b.bus_number = '838AC' AND s.stop_order = 3 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '838AC' AND s.stop_order = 4 THEN 'COIMBATORE MEDICAL COLLEGE'
    WHEN b.bus_number = '838AC' AND s.stop_order = 5 THEN 'KMC HOSPITAL'
    WHEN b.bus_number = '838AC' AND s.stop_order = 6 THEN 'NEELAMBUR BYE PASS'
    WHEN b.bus_number = '838AC' AND s.stop_order = 7 THEN 'KARUMATHAMPATTI'
    WHEN b.bus_number = '838AC' AND s.stop_order = 8 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '838AC' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '664EUD' AND s.stop_order = 2 THEN 'COONOOR'
    WHEN b.bus_number = '664EUD' AND s.stop_order = 3 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664EUD' AND s.stop_order = 4 THEN 'KOVILPATTI BYPASS BS'
    WHEN b.bus_number = '664kUD' AND s.stop_order = 1 THEN 'COONOOR'
    WHEN b.bus_number = '664kUD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '663AUD' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '429CUD' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533EF' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533EF' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '003A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '003A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533AB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533D' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909H' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533GH' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533GH' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909L' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909L' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805M' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '805M' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '411AM' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '411AM' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533EF' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533EF' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '911J' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '911J' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '725UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533GH' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533GH' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533AB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805T' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '805T' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909K' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909K' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '911T' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '911T' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533EF' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533EF' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '410A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '410A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805H' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '805H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '20012' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '20012' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '20009' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '20009' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '931A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '931A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533C' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533AB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909G' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533GH' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '533GH' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '911Y' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '911Y' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909Q' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909Q' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '534A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '534A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805F' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '805F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '601E' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '601E' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '909B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '950A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '302A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '854NS' AND s.stop_order = 1 THEN 'TIRUPPUR'
    WHEN b.bus_number = '854NS' AND s.stop_order = 2 THEN 'PERUNDURAI'
    WHEN b.bus_number = '854NS' AND s.stop_order = 4 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '502B' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 3 THEN 'KOVILPATTI'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 4 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 5 THEN 'VIRUDHNAGAR BYPASS BS'
    WHEN b.bus_number = '125KUD' AND s.stop_order = 6 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '460D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '846AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846AB' AND s.stop_order = 3 THEN 'SAMAYANALLUR BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 4 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846AB' AND s.stop_order = 5 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '872AB' AND s.stop_order = 1 THEN 'ARUPPUKOTAI GANDINAGAR BYPASS'
    WHEN b.bus_number = '872AB' AND s.stop_order = 2 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '872AB' AND s.stop_order = 3 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '872AB' AND s.stop_order = 4 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '872AB' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '872NS' AND s.stop_order = 1 THEN 'EPPODUMVENDRAN'
    WHEN b.bus_number = '872NS' AND s.stop_order = 2 THEN 'ETTAYAPURAM'
    WHEN b.bus_number = '872NS' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '872NS' AND s.stop_order = 5 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '872NS' AND s.stop_order = 6 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '872NS' AND s.stop_order = 7 THEN 'SAMAYANALLUR BS'
    WHEN b.bus_number = '872NS' AND s.stop_order = 8 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '872NS' AND s.stop_order = 9 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 1 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 2 THEN 'FATHIMA COLLEGE'
    WHEN b.bus_number = '846AB' AND s.stop_order = 3 THEN 'SAMAYANALLUR BS'
    WHEN b.bus_number = '846AB' AND s.stop_order = 4 THEN 'KODAI ROAD TOLL'
    WHEN b.bus_number = '846AB' AND s.stop_order = 5 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '638UD' AND s.stop_order = 1 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '104B1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '104B1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '322B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '321B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '322A' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '560KUD' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 1 THEN 'VADACHERRY'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 2 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505TCY' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125AC' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '125AC' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505TRYB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 2 THEN 'KAVALKINARU'
    WHEN b.bus_number = '125BUD' AND s.stop_order = 5 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125AC' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '125AC' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '125AC' AND s.stop_order = 2 THEN 'KAVALKINARU'
    WHEN b.bus_number = '125AC' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '795NS' AND s.stop_order = 3 THEN 'VALLIYOOR'
    WHEN b.bus_number = '444U' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444H' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100J' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100L' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100F' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100N' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100X' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100O' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100S' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100G' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100I' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '300JV' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '708A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100P' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100J' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100Q' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100R' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100JK' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100K' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100L' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '840AB' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '100LM' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '840NS' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '100MN' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '840NS' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '100M' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '840NS' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '100KL' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100P' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100TU' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100R' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100OT' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100OY' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100OP' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100V' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100T' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100U' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100PQ' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100QR' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100ST' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '100W' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '204B' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '146' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '444SA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '827UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827UD' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '827UD' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '827UD' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '827UD' AND s.stop_order = 4 THEN 'GUNASEELAM'
    WHEN b.bus_number = '827UD' AND s.stop_order = 5 THEN 'MUSIRI BYEPASS'
    WHEN b.bus_number = '827UD' AND s.stop_order = 6 THEN 'THOTTIYAM'
    WHEN b.bus_number = '827UD' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '827AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827AB' AND s.stop_order = 1 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '827AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827AB' AND s.stop_order = 1 THEN 'TRICHY CHATHIRAM BS KARUR STOP'
    WHEN b.bus_number = '827AB' AND s.stop_order = 2 THEN 'PETTAVAITHALAI'
    WHEN b.bus_number = '827AB' AND s.stop_order = 3 THEN 'KULITHALAI'
    WHEN b.bus_number = '827AB' AND s.stop_order = 4 THEN 'MUSIRI BRIDGE'
    WHEN b.bus_number = '827AB' AND s.stop_order = 5 THEN 'THOTTIYAM'
    WHEN b.bus_number = '827AB' AND s.stop_order = 6 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '827NS' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827NS' AND s.stop_order = 1 THEN 'TRICHY CHATHIRAM BS KARUR STOP'
    WHEN b.bus_number = '827NS' AND s.stop_order = 2 THEN 'PETTAVAITHALAI'
    WHEN b.bus_number = '827NS' AND s.stop_order = 3 THEN 'KULITHALAI'
    WHEN b.bus_number = '827NS' AND s.stop_order = 4 THEN 'MUSIRI BRIDGE'
    WHEN b.bus_number = '827NS' AND s.stop_order = 5 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '827AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '827AB' AND s.stop_order = 1 THEN 'TVS TOLL GATE'
    WHEN b.bus_number = '827AB' AND s.stop_order = 2 THEN 'PALPANNAI'
    WHEN b.bus_number = '827AB' AND s.stop_order = 3 THEN 'NO 1 TOLL GATE'
    WHEN b.bus_number = '827AB' AND s.stop_order = 4 THEN 'GUNASEELAM'
    WHEN b.bus_number = '827AB' AND s.stop_order = 5 THEN 'MUSIRI'
    WHEN b.bus_number = '827AB' AND s.stop_order = 6 THEN 'HOSUR'
    WHEN b.bus_number = '827AB' AND s.stop_order = 7 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '552T' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '552T' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 1 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 2 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 3 THEN 'KOVILPATTI'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 4 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 5 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '180RUD' AND s.stop_order = 7 THEN 'SRIPERAMBUDUR'
    WHEN b.bus_number = '555C' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444G' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444O' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444K' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '555B' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444J' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444M' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444HI' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '555A' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444B' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444D' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444P' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444N' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444T' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444E' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444MA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444MA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444X' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444X' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '555AB' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444GA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444GA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444Q' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444D' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444JA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444AA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444AA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '555AA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444S' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444CA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444GF' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444NA' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '444GE' AND s.stop_order = 1 THEN 'SATELLITE BS'
    WHEN b.bus_number = '304I' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304A' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304J' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304O' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 1 THEN 'CHITT0OR'
    WHEN b.bus_number = '850AC' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304K' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304P' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850UD' AND s.stop_order = 1 THEN 'CHITT0OR'
    WHEN b.bus_number = '850UD' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '850AC' AND s.stop_order = 1 THEN 'CHITT0OR'
    WHEN b.bus_number = '850AC' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304R' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACA' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304E' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304S' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304L' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304M' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '305B' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304T' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304Q' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '305C' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304U' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304F' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304V' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304G' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACB' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304N' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304H' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '104UD' AND s.stop_order = 1 THEN 'THIRUVANNAMALAI'
    WHEN b.bus_number = '104UD' AND s.stop_order = 2 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '304ACC' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '969UD' AND s.stop_order = 3 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '325D' AND s.stop_order = 1 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '510I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508L' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '508M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '509G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '338NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '338NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '338NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '338NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '338NS' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '338NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '338NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '338NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '508N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 10 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '791AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '791AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '791AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '791AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '791AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '791AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '791AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '791AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '791AB' AND s.stop_order = 11 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '791AB' AND s.stop_order = 12 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '791AB' AND s.stop_order = 13 THEN 'ERNAKULAM SOUTH KSRTC B.S'
    WHEN b.bus_number = '785LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '785LB' AND s.stop_order = 1 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '785LB' AND s.stop_order = 5 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '785LB' AND s.stop_order = 6 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '460UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460UD' AND s.stop_order = 10 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AC' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460MS' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460AS' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 0 THEN 'CHENNAI TIRUVANMIYUR'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 1 THEN 'SRP TOOLS'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 2 THEN 'VELACHERY'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 3 THEN 'CHROMEPET MTC BS'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 4 THEN 'CHENNAI TAMBARAM'
    WHEN b.bus_number = '460TAB' AND s.stop_order = 5 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460NS' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460AB' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460AS' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '460NS' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AB' AND s.stop_order = 8 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460LB' AND s.stop_order = 8 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '460AL' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '460AL' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '460AL' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '460AL' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '460AL' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '460AL' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '460AL' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '460AL' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '460AL' AND s.stop_order = 8 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '152N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '152A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '152C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '152G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '284AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '284AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '284AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '284AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '284AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '284AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '284KUD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '794UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '794UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '794UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '794UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '794UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '794UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '794UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '838AB' AND s.stop_order = 10)
  OR   (b.bus_number = '838AC' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 0)
  OR   (b.bus_number = '838AB' AND s.stop_order = 1)
  OR   (b.bus_number = '838AB' AND s.stop_order = 2)
  OR   (b.bus_number = '838AB' AND s.stop_order = 3)
  OR   (b.bus_number = '838AB' AND s.stop_order = 4)
  OR   (b.bus_number = '838AB' AND s.stop_order = 5)
  OR   (b.bus_number = '838AB' AND s.stop_order = 6)
  OR   (b.bus_number = '838MS' AND s.stop_order = 0)
  OR   (b.bus_number = '838MS' AND s.stop_order = 1)
  OR   (b.bus_number = '838MS' AND s.stop_order = 2)
  OR   (b.bus_number = '838MS' AND s.stop_order = 3)
  OR   (b.bus_number = '838MS' AND s.stop_order = 4)
  OR   (b.bus_number = '838MS' AND s.stop_order = 5)
  OR   (b.bus_number = '838MS' AND s.stop_order = 6)
  OR   (b.bus_number = '838MS' AND s.stop_order = 7)
  OR   (b.bus_number = '838MS' AND s.stop_order = 8)
  OR   (b.bus_number = '838MS' AND s.stop_order = 9)
  OR   (b.bus_number = '838MS' AND s.stop_order = 10)
  OR   (b.bus_number = '838AC' AND s.stop_order = 0)
  OR   (b.bus_number = '838AC' AND s.stop_order = 1)
  OR   (b.bus_number = '838AC' AND s.stop_order = 2)
  OR   (b.bus_number = '838AC' AND s.stop_order = 3)
  OR   (b.bus_number = '838AC' AND s.stop_order = 4)
  OR   (b.bus_number = '838AC' AND s.stop_order = 5)
  OR   (b.bus_number = '838AC' AND s.stop_order = 6)
  OR   (b.bus_number = '838AC' AND s.stop_order = 7)
  OR   (b.bus_number = '838AC' AND s.stop_order = 8)
  OR   (b.bus_number = '838AC' AND s.stop_order = 9)
  OR   (b.bus_number = '664EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '664EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '664EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '664kUD' AND s.stop_order = 1)
  OR   (b.bus_number = '664kUD' AND s.stop_order = 2)
  OR   (b.bus_number = '663AUD' AND s.stop_order = 1)
  OR   (b.bus_number = '429CUD' AND s.stop_order = 1)
  OR   (b.bus_number = '533EF' AND s.stop_order = 0)
  OR   (b.bus_number = '533EF' AND s.stop_order = 1)
  OR   (b.bus_number = '003A' AND s.stop_order = 0)
  OR   (b.bus_number = '003A' AND s.stop_order = 1)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 1)
  OR   (b.bus_number = '533D' AND s.stop_order = 0)
  OR   (b.bus_number = '533D' AND s.stop_order = 1)
  OR   (b.bus_number = '909H' AND s.stop_order = 0)
  OR   (b.bus_number = '909H' AND s.stop_order = 1)
  OR   (b.bus_number = '533GH' AND s.stop_order = 0)
  OR   (b.bus_number = '533GH' AND s.stop_order = 1)
  OR   (b.bus_number = '909L' AND s.stop_order = 0)
  OR   (b.bus_number = '909L' AND s.stop_order = 1)
  OR   (b.bus_number = '805M' AND s.stop_order = 0)
  OR   (b.bus_number = '805M' AND s.stop_order = 1)
  OR   (b.bus_number = '411AM' AND s.stop_order = 0)
  OR   (b.bus_number = '411AM' AND s.stop_order = 1)
  OR   (b.bus_number = '533EF' AND s.stop_order = 0)
  OR   (b.bus_number = '533EF' AND s.stop_order = 1)
  OR   (b.bus_number = '911J' AND s.stop_order = 0)
  OR   (b.bus_number = '911J' AND s.stop_order = 1)
  OR   (b.bus_number = '725UD' AND s.stop_order = 2)
  OR   (b.bus_number = '533GH' AND s.stop_order = 0)
  OR   (b.bus_number = '533GH' AND s.stop_order = 1)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 1)
  OR   (b.bus_number = '805T' AND s.stop_order = 0)
  OR   (b.bus_number = '805T' AND s.stop_order = 1)
  OR   (b.bus_number = '909K' AND s.stop_order = 0)
  OR   (b.bus_number = '909K' AND s.stop_order = 1)
  OR   (b.bus_number = '911T' AND s.stop_order = 0)
  OR   (b.bus_number = '911T' AND s.stop_order = 1)
  OR   (b.bus_number = '533EF' AND s.stop_order = 0)
  OR   (b.bus_number = '533EF' AND s.stop_order = 1)
  OR   (b.bus_number = '410A' AND s.stop_order = 0)
  OR   (b.bus_number = '410A' AND s.stop_order = 1)
  OR   (b.bus_number = '805H' AND s.stop_order = 0)
  OR   (b.bus_number = '805H' AND s.stop_order = 1)
  OR   (b.bus_number = '20012' AND s.stop_order = 0)
  OR   (b.bus_number = '20012' AND s.stop_order = 1)
  OR   (b.bus_number = '20009' AND s.stop_order = 0)
  OR   (b.bus_number = '20009' AND s.stop_order = 1)
  OR   (b.bus_number = '931A' AND s.stop_order = 0)
  OR   (b.bus_number = '931A' AND s.stop_order = 1)
  OR   (b.bus_number = '533C' AND s.stop_order = 0)
  OR   (b.bus_number = '533C' AND s.stop_order = 1)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 1)
  OR   (b.bus_number = '909G' AND s.stop_order = 0)
  OR   (b.bus_number = '909G' AND s.stop_order = 1)
  OR   (b.bus_number = '533GH' AND s.stop_order = 0)
  OR   (b.bus_number = '533GH' AND s.stop_order = 1)
  OR   (b.bus_number = '911Y' AND s.stop_order = 0)
  OR   (b.bus_number = '911Y' AND s.stop_order = 1)
  OR   (b.bus_number = '909Q' AND s.stop_order = 0)
  OR   (b.bus_number = '909Q' AND s.stop_order = 1)
  OR   (b.bus_number = '534A' AND s.stop_order = 0)
  OR   (b.bus_number = '534A' AND s.stop_order = 1)
  OR   (b.bus_number = '805F' AND s.stop_order = 0)
  OR   (b.bus_number = '805F' AND s.stop_order = 1)
  OR   (b.bus_number = '601E' AND s.stop_order = 0)
  OR   (b.bus_number = '601E' AND s.stop_order = 1)
  OR   (b.bus_number = '909B' AND s.stop_order = 0)
  OR   (b.bus_number = '909B' AND s.stop_order = 1)
  OR   (b.bus_number = '950A' AND s.stop_order = 1)
  OR   (b.bus_number = '302A' AND s.stop_order = 1)
  OR   (b.bus_number = '854NS' AND s.stop_order = 1)
  OR   (b.bus_number = '854NS' AND s.stop_order = 2)
  OR   (b.bus_number = '854NS' AND s.stop_order = 4)
  OR   (b.bus_number = '502B' AND s.stop_order = 1)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 4)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '125KUD' AND s.stop_order = 6)
  OR   (b.bus_number = '460D' AND s.stop_order = 1)
  OR   (b.bus_number = '846AB' AND s.stop_order = 0)
  OR   (b.bus_number = '846AB' AND s.stop_order = 1)
  OR   (b.bus_number = '846AB' AND s.stop_order = 2)
  OR   (b.bus_number = '846AB' AND s.stop_order = 3)
  OR   (b.bus_number = '846AB' AND s.stop_order = 4)
  OR   (b.bus_number = '846AB' AND s.stop_order = 5)
  OR   (b.bus_number = '872AB' AND s.stop_order = 1)
  OR   (b.bus_number = '872AB' AND s.stop_order = 2)
  OR   (b.bus_number = '872AB' AND s.stop_order = 3)
  OR   (b.bus_number = '872AB' AND s.stop_order = 4)
  OR   (b.bus_number = '872AB' AND s.stop_order = 7)
  OR   (b.bus_number = '872NS' AND s.stop_order = 1)
  OR   (b.bus_number = '872NS' AND s.stop_order = 2)
  OR   (b.bus_number = '872NS' AND s.stop_order = 4)
  OR   (b.bus_number = '872NS' AND s.stop_order = 5)
  OR   (b.bus_number = '872NS' AND s.stop_order = 6)
  OR   (b.bus_number = '872NS' AND s.stop_order = 7)
  OR   (b.bus_number = '872NS' AND s.stop_order = 8)
  OR   (b.bus_number = '872NS' AND s.stop_order = 9)
  OR   (b.bus_number = '846AB' AND s.stop_order = 0)
  OR   (b.bus_number = '846AB' AND s.stop_order = 1)
  OR   (b.bus_number = '846AB' AND s.stop_order = 2)
  OR   (b.bus_number = '846AB' AND s.stop_order = 3)
  OR   (b.bus_number = '846AB' AND s.stop_order = 4)
  OR   (b.bus_number = '846AB' AND s.stop_order = 5)
  OR   (b.bus_number = '638UD' AND s.stop_order = 1)
  OR   (b.bus_number = '104B1' AND s.stop_order = 0)
  OR   (b.bus_number = '104B1' AND s.stop_order = 0)
  OR   (b.bus_number = '322B' AND s.stop_order = 0)
  OR   (b.bus_number = '321B' AND s.stop_order = 0)
  OR   (b.bus_number = '322A' AND s.stop_order = 0)
  OR   (b.bus_number = '560KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 1)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 2)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 4)
  OR   (b.bus_number = '505TCY' AND s.stop_order = 1)
  OR   (b.bus_number = '125AC' AND s.stop_order = 1)
  OR   (b.bus_number = '125AC' AND s.stop_order = 3)
  OR   (b.bus_number = '505TRYB' AND s.stop_order = 1)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 0)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 1)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 2)
  OR   (b.bus_number = '125BUD' AND s.stop_order = 5)
  OR   (b.bus_number = '125AC' AND s.stop_order = 0)
  OR   (b.bus_number = '125AC' AND s.stop_order = 1)
  OR   (b.bus_number = '125AC' AND s.stop_order = 2)
  OR   (b.bus_number = '125AC' AND s.stop_order = 4)
  OR   (b.bus_number = '795NS' AND s.stop_order = 3)
  OR   (b.bus_number = '444U' AND s.stop_order = 1)
  OR   (b.bus_number = '444H' AND s.stop_order = 1)
  OR   (b.bus_number = '100J' AND s.stop_order = 1)
  OR   (b.bus_number = '100A' AND s.stop_order = 1)
  OR   (b.bus_number = '100L' AND s.stop_order = 1)
  OR   (b.bus_number = '100F' AND s.stop_order = 1)
  OR   (b.bus_number = '100N' AND s.stop_order = 1)
  OR   (b.bus_number = '100X' AND s.stop_order = 1)
  OR   (b.bus_number = '100O' AND s.stop_order = 1)
  OR   (b.bus_number = '100S' AND s.stop_order = 1)
  OR   (b.bus_number = '100G' AND s.stop_order = 1)
  OR   (b.bus_number = '100I' AND s.stop_order = 1)
  OR   (b.bus_number = '300JV' AND s.stop_order = 1)
  OR   (b.bus_number = '708A' AND s.stop_order = 1)
  OR   (b.bus_number = '100P' AND s.stop_order = 1)
  OR   (b.bus_number = '100J' AND s.stop_order = 1)
  OR   (b.bus_number = '100Q' AND s.stop_order = 1)
  OR   (b.bus_number = '100R' AND s.stop_order = 1)
  OR   (b.bus_number = '100JK' AND s.stop_order = 1)
  OR   (b.bus_number = '100K' AND s.stop_order = 1)
  OR   (b.bus_number = '100L' AND s.stop_order = 1)
  OR   (b.bus_number = '840AB' AND s.stop_order = 1)
  OR   (b.bus_number = '100LM' AND s.stop_order = 1)
  OR   (b.bus_number = '840NS' AND s.stop_order = 1)
  OR   (b.bus_number = '100MN' AND s.stop_order = 1)
  OR   (b.bus_number = '840NS' AND s.stop_order = 1)
  OR   (b.bus_number = '100M' AND s.stop_order = 1)
  OR   (b.bus_number = '840NS' AND s.stop_order = 1)
  OR   (b.bus_number = '100KL' AND s.stop_order = 1)
  OR   (b.bus_number = '100P' AND s.stop_order = 1)
  OR   (b.bus_number = '100TU' AND s.stop_order = 1)
  OR   (b.bus_number = '100R' AND s.stop_order = 1)
  OR   (b.bus_number = '100OT' AND s.stop_order = 1)
  OR   (b.bus_number = '100OY' AND s.stop_order = 1)
  OR   (b.bus_number = '100OP' AND s.stop_order = 1)
  OR   (b.bus_number = '100V' AND s.stop_order = 1)
  OR   (b.bus_number = '100T' AND s.stop_order = 1)
  OR   (b.bus_number = '100U' AND s.stop_order = 1)
  OR   (b.bus_number = '100PQ' AND s.stop_order = 1)
  OR   (b.bus_number = '100QR' AND s.stop_order = 1)
  OR   (b.bus_number = '100ST' AND s.stop_order = 1)
  OR   (b.bus_number = '100W' AND s.stop_order = 1)
  OR   (b.bus_number = '204B' AND s.stop_order = 1)
  OR   (b.bus_number = '146' AND s.stop_order = 0)
  OR   (b.bus_number = '444SA' AND s.stop_order = 1)
  OR   (b.bus_number = '827UD' AND s.stop_order = 0)
  OR   (b.bus_number = '827UD' AND s.stop_order = 1)
  OR   (b.bus_number = '827UD' AND s.stop_order = 2)
  OR   (b.bus_number = '827UD' AND s.stop_order = 3)
  OR   (b.bus_number = '827UD' AND s.stop_order = 4)
  OR   (b.bus_number = '827UD' AND s.stop_order = 5)
  OR   (b.bus_number = '827UD' AND s.stop_order = 6)
  OR   (b.bus_number = '827UD' AND s.stop_order = 7)
  OR   (b.bus_number = '827AB' AND s.stop_order = 0)
  OR   (b.bus_number = '827AB' AND s.stop_order = 1)
  OR   (b.bus_number = '827AB' AND s.stop_order = 0)
  OR   (b.bus_number = '827AB' AND s.stop_order = 1)
  OR   (b.bus_number = '827AB' AND s.stop_order = 2)
  OR   (b.bus_number = '827AB' AND s.stop_order = 3)
  OR   (b.bus_number = '827AB' AND s.stop_order = 4)
  OR   (b.bus_number = '827AB' AND s.stop_order = 5)
  OR   (b.bus_number = '827AB' AND s.stop_order = 6)
  OR   (b.bus_number = '827NS' AND s.stop_order = 0)
  OR   (b.bus_number = '827NS' AND s.stop_order = 1)
  OR   (b.bus_number = '827NS' AND s.stop_order = 2)
  OR   (b.bus_number = '827NS' AND s.stop_order = 3)
  OR   (b.bus_number = '827NS' AND s.stop_order = 4)
  OR   (b.bus_number = '827NS' AND s.stop_order = 5)
  OR   (b.bus_number = '827AB' AND s.stop_order = 0)
  OR   (b.bus_number = '827AB' AND s.stop_order = 1)
  OR   (b.bus_number = '827AB' AND s.stop_order = 2)
  OR   (b.bus_number = '827AB' AND s.stop_order = 3)
  OR   (b.bus_number = '827AB' AND s.stop_order = 4)
  OR   (b.bus_number = '827AB' AND s.stop_order = 5)
  OR   (b.bus_number = '827AB' AND s.stop_order = 6)
  OR   (b.bus_number = '827AB' AND s.stop_order = 7)
  OR   (b.bus_number = '552T' AND s.stop_order = 0)
  OR   (b.bus_number = '552T' AND s.stop_order = 0)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 1)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 2)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 3)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 4)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 5)
  OR   (b.bus_number = '180RUD' AND s.stop_order = 7)
  OR   (b.bus_number = '555C' AND s.stop_order = 1)
  OR   (b.bus_number = '444G' AND s.stop_order = 1)
  OR   (b.bus_number = '444O' AND s.stop_order = 1)
  OR   (b.bus_number = '444K' AND s.stop_order = 1)
  OR   (b.bus_number = '555B' AND s.stop_order = 1)
  OR   (b.bus_number = '444J' AND s.stop_order = 1)
  OR   (b.bus_number = '444A' AND s.stop_order = 1)
  OR   (b.bus_number = '444M' AND s.stop_order = 1)
  OR   (b.bus_number = '444HI' AND s.stop_order = 1)
  OR   (b.bus_number = '555A' AND s.stop_order = 1)
  OR   (b.bus_number = '444B' AND s.stop_order = 1)
  OR   (b.bus_number = '444D' AND s.stop_order = 1)
  OR   (b.bus_number = '444P' AND s.stop_order = 1)
  OR   (b.bus_number = '444N' AND s.stop_order = 1)
  OR   (b.bus_number = '444T' AND s.stop_order = 1)
  OR   (b.bus_number = '444E' AND s.stop_order = 1)
  OR   (b.bus_number = '444MA' AND s.stop_order = 1)
  OR   (b.bus_number = '444MA' AND s.stop_order = 1)
  OR   (b.bus_number = '444X' AND s.stop_order = 1)
  OR   (b.bus_number = '444X' AND s.stop_order = 1)
  OR   (b.bus_number = '555AB' AND s.stop_order = 1)
  OR   (b.bus_number = '444GA' AND s.stop_order = 1)
  OR   (b.bus_number = '444GA' AND s.stop_order = 1)
  OR   (b.bus_number = '444Q' AND s.stop_order = 1)
  OR   (b.bus_number = '444D' AND s.stop_order = 1)
  OR   (b.bus_number = '444JA' AND s.stop_order = 1)
  OR   (b.bus_number = '444AA' AND s.stop_order = 1)
  OR   (b.bus_number = '444AA' AND s.stop_order = 1)
  OR   (b.bus_number = '555AA' AND s.stop_order = 1)
  OR   (b.bus_number = '444S' AND s.stop_order = 1)
  OR   (b.bus_number = '444CA' AND s.stop_order = 1)
  OR   (b.bus_number = '444GF' AND s.stop_order = 1)
  OR   (b.bus_number = '444NA' AND s.stop_order = 1)
  OR   (b.bus_number = '444GE' AND s.stop_order = 1)
  OR   (b.bus_number = '304I' AND s.stop_order = 1)
  OR   (b.bus_number = '304A' AND s.stop_order = 1)
  OR   (b.bus_number = '304J' AND s.stop_order = 1)
  OR   (b.bus_number = '304O' AND s.stop_order = 1)
  OR   (b.bus_number = '304B' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 3)
  OR   (b.bus_number = '304K' AND s.stop_order = 1)
  OR   (b.bus_number = '304P' AND s.stop_order = 1)
  OR   (b.bus_number = '850UD' AND s.stop_order = 1)
  OR   (b.bus_number = '850UD' AND s.stop_order = 3)
  OR   (b.bus_number = '304C' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 1)
  OR   (b.bus_number = '850AC' AND s.stop_order = 3)
  OR   (b.bus_number = '304R' AND s.stop_order = 1)
  OR   (b.bus_number = '304ACA' AND s.stop_order = 1)
  OR   (b.bus_number = '304E' AND s.stop_order = 1)
  OR   (b.bus_number = '304S' AND s.stop_order = 1)
  OR   (b.bus_number = '304L' AND s.stop_order = 1)
  OR   (b.bus_number = '304M' AND s.stop_order = 1)
  OR   (b.bus_number = '305B' AND s.stop_order = 1)
  OR   (b.bus_number = '304T' AND s.stop_order = 1)
  OR   (b.bus_number = '304Q' AND s.stop_order = 1)
  OR   (b.bus_number = '305C' AND s.stop_order = 1)
  OR   (b.bus_number = '304U' AND s.stop_order = 1)
  OR   (b.bus_number = '304F' AND s.stop_order = 1)
  OR   (b.bus_number = '304V' AND s.stop_order = 1)
  OR   (b.bus_number = '304G' AND s.stop_order = 1)
  OR   (b.bus_number = '304ACB' AND s.stop_order = 1)
  OR   (b.bus_number = '304N' AND s.stop_order = 1)
  OR   (b.bus_number = '304H' AND s.stop_order = 1)
  OR   (b.bus_number = '104UD' AND s.stop_order = 1)
  OR   (b.bus_number = '104UD' AND s.stop_order = 2)
  OR   (b.bus_number = '304ACC' AND s.stop_order = 1)
  OR   (b.bus_number = '969UD' AND s.stop_order = 3)
  OR   (b.bus_number = '325D' AND s.stop_order = 1)
  OR   (b.bus_number = '510I' AND s.stop_order = 0)
  OR   (b.bus_number = '508E' AND s.stop_order = 0)
  OR   (b.bus_number = '510J' AND s.stop_order = 0)
  OR   (b.bus_number = '508K' AND s.stop_order = 0)
  OR   (b.bus_number = '508L' AND s.stop_order = 0)
  OR   (b.bus_number = '508M' AND s.stop_order = 0)
  OR   (b.bus_number = '509G' AND s.stop_order = 0)
  OR   (b.bus_number = '338NS' AND s.stop_order = 0)
  OR   (b.bus_number = '338NS' AND s.stop_order = 1)
  OR   (b.bus_number = '338NS' AND s.stop_order = 2)
  OR   (b.bus_number = '338NS' AND s.stop_order = 3)
  OR   (b.bus_number = '338NS' AND s.stop_order = 4)
  OR   (b.bus_number = '338NS' AND s.stop_order = 5)
  OR   (b.bus_number = '338NS' AND s.stop_order = 6)
  OR   (b.bus_number = '338NS' AND s.stop_order = 7)
  OR   (b.bus_number = '508N' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 10)
  OR   (b.bus_number = '791AB' AND s.stop_order = 0)
  OR   (b.bus_number = '791AB' AND s.stop_order = 1)
  OR   (b.bus_number = '791AB' AND s.stop_order = 2)
  OR   (b.bus_number = '791AB' AND s.stop_order = 3)
  OR   (b.bus_number = '791AB' AND s.stop_order = 4)
  OR   (b.bus_number = '791AB' AND s.stop_order = 5)
  OR   (b.bus_number = '791AB' AND s.stop_order = 6)
  OR   (b.bus_number = '791AB' AND s.stop_order = 7)
  OR   (b.bus_number = '791AB' AND s.stop_order = 8)
  OR   (b.bus_number = '791AB' AND s.stop_order = 11)
  OR   (b.bus_number = '791AB' AND s.stop_order = 12)
  OR   (b.bus_number = '791AB' AND s.stop_order = 13)
  OR   (b.bus_number = '785LB' AND s.stop_order = 0)
  OR   (b.bus_number = '785LB' AND s.stop_order = 1)
  OR   (b.bus_number = '785LB' AND s.stop_order = 5)
  OR   (b.bus_number = '785LB' AND s.stop_order = 6)
  OR   (b.bus_number = '460UD' AND s.stop_order = 0)
  OR   (b.bus_number = '460UD' AND s.stop_order = 1)
  OR   (b.bus_number = '460UD' AND s.stop_order = 2)
  OR   (b.bus_number = '460UD' AND s.stop_order = 3)
  OR   (b.bus_number = '460UD' AND s.stop_order = 4)
  OR   (b.bus_number = '460UD' AND s.stop_order = 5)
  OR   (b.bus_number = '460UD' AND s.stop_order = 6)
  OR   (b.bus_number = '460UD' AND s.stop_order = 7)
  OR   (b.bus_number = '460UD' AND s.stop_order = 10)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AC' AND s.stop_order = 0)
  OR   (b.bus_number = '460AC' AND s.stop_order = 1)
  OR   (b.bus_number = '460MS' AND s.stop_order = 0)
  OR   (b.bus_number = '460MS' AND s.stop_order = 1)
  OR   (b.bus_number = '460AS' AND s.stop_order = 0)
  OR   (b.bus_number = '460AS' AND s.stop_order = 1)
  OR   (b.bus_number = '460AS' AND s.stop_order = 2)
  OR   (b.bus_number = '460AS' AND s.stop_order = 3)
  OR   (b.bus_number = '460AS' AND s.stop_order = 4)
  OR   (b.bus_number = '460AS' AND s.stop_order = 5)
  OR   (b.bus_number = '460AS' AND s.stop_order = 6)
  OR   (b.bus_number = '460AS' AND s.stop_order = 7)
  OR   (b.bus_number = '460AS' AND s.stop_order = 8)
  OR   (b.bus_number = '460AS' AND s.stop_order = 9)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 0)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 1)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 2)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 3)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 4)
  OR   (b.bus_number = '460TAB' AND s.stop_order = 5)
  OR   (b.bus_number = '460NS' AND s.stop_order = 0)
  OR   (b.bus_number = '460NS' AND s.stop_order = 1)
  OR   (b.bus_number = '460NS' AND s.stop_order = 2)
  OR   (b.bus_number = '460NS' AND s.stop_order = 3)
  OR   (b.bus_number = '460NS' AND s.stop_order = 4)
  OR   (b.bus_number = '460NS' AND s.stop_order = 5)
  OR   (b.bus_number = '460NS' AND s.stop_order = 6)
  OR   (b.bus_number = '460NS' AND s.stop_order = 7)
  OR   (b.bus_number = '460NS' AND s.stop_order = 8)
  OR   (b.bus_number = '460NS' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AB' AND s.stop_order = 9)
  OR   (b.bus_number = '460AS' AND s.stop_order = 0)
  OR   (b.bus_number = '460AS' AND s.stop_order = 1)
  OR   (b.bus_number = '460AS' AND s.stop_order = 2)
  OR   (b.bus_number = '460AS' AND s.stop_order = 3)
  OR   (b.bus_number = '460AS' AND s.stop_order = 4)
  OR   (b.bus_number = '460AS' AND s.stop_order = 5)
  OR   (b.bus_number = '460AS' AND s.stop_order = 6)
  OR   (b.bus_number = '460AS' AND s.stop_order = 7)
  OR   (b.bus_number = '460AS' AND s.stop_order = 8)
  OR   (b.bus_number = '460AS' AND s.stop_order = 9)
  OR   (b.bus_number = '460NS' AND s.stop_order = 0)
  OR   (b.bus_number = '460NS' AND s.stop_order = 1)
  OR   (b.bus_number = '460NS' AND s.stop_order = 2)
  OR   (b.bus_number = '460NS' AND s.stop_order = 3)
  OR   (b.bus_number = '460NS' AND s.stop_order = 4)
  OR   (b.bus_number = '460NS' AND s.stop_order = 5)
  OR   (b.bus_number = '460NS' AND s.stop_order = 6)
  OR   (b.bus_number = '460NS' AND s.stop_order = 7)
  OR   (b.bus_number = '460NS' AND s.stop_order = 8)
  OR   (b.bus_number = '460NS' AND s.stop_order = 9)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 3)
  OR   (b.bus_number = '460AB' AND s.stop_order = 4)
  OR   (b.bus_number = '460AB' AND s.stop_order = 5)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '460AB' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 8)
  OR   (b.bus_number = '460LB' AND s.stop_order = 0)
  OR   (b.bus_number = '460LB' AND s.stop_order = 1)
  OR   (b.bus_number = '460LB' AND s.stop_order = 2)
  OR   (b.bus_number = '460LB' AND s.stop_order = 3)
  OR   (b.bus_number = '460LB' AND s.stop_order = 4)
  OR   (b.bus_number = '460LB' AND s.stop_order = 5)
  OR   (b.bus_number = '460LB' AND s.stop_order = 6)
  OR   (b.bus_number = '460LB' AND s.stop_order = 7)
  OR   (b.bus_number = '460LB' AND s.stop_order = 8)
  OR   (b.bus_number = '460AL' AND s.stop_order = 0)
  OR   (b.bus_number = '460AL' AND s.stop_order = 1)
  OR   (b.bus_number = '460AL' AND s.stop_order = 2)
  OR   (b.bus_number = '460AL' AND s.stop_order = 3)
  OR   (b.bus_number = '460AL' AND s.stop_order = 4)
  OR   (b.bus_number = '460AL' AND s.stop_order = 5)
  OR   (b.bus_number = '460AL' AND s.stop_order = 6)
  OR   (b.bus_number = '460AL' AND s.stop_order = 7)
  OR   (b.bus_number = '460AL' AND s.stop_order = 8)
  OR   (b.bus_number = '152N' AND s.stop_order = 0)
  OR   (b.bus_number = '152A' AND s.stop_order = 0)
  OR   (b.bus_number = '152C' AND s.stop_order = 0)
  OR   (b.bus_number = '152G' AND s.stop_order = 0)
  OR   (b.bus_number = '284AB' AND s.stop_order = 0)
  OR   (b.bus_number = '284AB' AND s.stop_order = 1)
  OR   (b.bus_number = '284AB' AND s.stop_order = 2)
  OR   (b.bus_number = '284AB' AND s.stop_order = 3)
  OR   (b.bus_number = '284AB' AND s.stop_order = 4)
  OR   (b.bus_number = '284AB' AND s.stop_order = 5)
  OR   (b.bus_number = '284AB' AND s.stop_order = 6)
  OR   (b.bus_number = '284AB' AND s.stop_order = 7)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 0)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 1)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 2)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 3)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 4)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 6)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 7)
  OR   (b.bus_number = '284KUD' AND s.stop_order = 8)
  OR   (b.bus_number = '794UD' AND s.stop_order = 0)
  OR   (b.bus_number = '794UD' AND s.stop_order = 1)
  OR   (b.bus_number = '794UD' AND s.stop_order = 2)
  OR   (b.bus_number = '794UD' AND s.stop_order = 3)
  OR   (b.bus_number = '794UD' AND s.stop_order = 4)
  OR   (b.bus_number = '794UD' AND s.stop_order = 5)
  OR   (b.bus_number = '794UD' AND s.stop_order = 6)
);

-- Chunk 8/9 (500 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '794UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'H198NS' AND s.stop_order = 9 THEN 'VADACHERRY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '284NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '284NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '284NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '284NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '284NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '284NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '284NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '284NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '284UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '284UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '284UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '284UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '284UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '284UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '284UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '284UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '284UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '198MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198MS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198MS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198MS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198MS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198MS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198MS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198MS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198MS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '198MS' AND s.stop_order = 9 THEN 'VILLUPURAM'
    WHEN b.bus_number = '198AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '198NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '198LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198LB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = 'H198UD' AND s.stop_order = 10 THEN 'VADACHERRY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '198NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '198NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '198NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '198NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '198NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '675E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '675C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '675D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '675F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '675A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '425NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '425NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '425NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '425NS' AND s.stop_order = 3 THEN 'KATTANGULATTUR'
    WHEN b.bus_number = '425NS' AND s.stop_order = 4 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '425NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '425NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '425NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '425NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '425NS' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '675B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '425UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '425UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '425UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '425UD' AND s.stop_order = 3 THEN 'KATTANGULATTUR'
    WHEN b.bus_number = '425UD' AND s.stop_order = 4 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '425UD' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '425UD' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '425UD' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '425UD' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '425UD' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '425AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '425AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '425AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '425AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '425AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '425AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '425AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '425AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '425AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '133AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '133AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '133AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '133AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '133AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '174UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '174UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '174UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '174UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '174UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '174UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '174UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '174UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '131LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '131LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '131LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '131LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '131LB' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '131LB' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '131LB' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '131LB' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '131LB' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '131LB' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '126NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '126NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '126NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '126NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '126NS' AND s.stop_order = 4 THEN 'SINGAPERUMAL KOIL'
    WHEN b.bus_number = '126NS' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '126NS' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '126NS' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '126NS' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '155UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '155UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '155UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '155UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '155UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '155UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '155UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '155UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '155UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '136NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '136NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '136NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '136NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '136NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '136NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '136NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '136NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '136NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '133AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '133AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '133AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '133AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '133AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '133AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '144UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '144UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '144UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '144UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '144UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '144UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '144UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '144UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '144UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '136UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '136UD' AND s.stop_order = 1 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '136UD' AND s.stop_order = 2 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '136UD' AND s.stop_order = 3 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '136UD' AND s.stop_order = 4 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '136UD' AND s.stop_order = 5 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '136UD' AND s.stop_order = 6 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '136UD' AND s.stop_order = 7 THEN 'TINDIVANAM'
    WHEN b.bus_number = '133NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '133NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '133NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '133NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '133NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '133NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '133NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '126AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '537A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '839AC' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '839AC' AND s.stop_order = 2 THEN 'VIRUDHACHALAM BS'
    WHEN b.bus_number = '842UD' AND s.stop_order = 0 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '842UD' AND s.stop_order = 1 THEN 'HOPE COLLEGE'
    WHEN b.bus_number = '842UD' AND s.stop_order = 2 THEN 'AVINASHI NEW BUS STAND'
    WHEN b.bus_number = '839UD' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '457I' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '505CBEEF' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '783UD' AND s.stop_order = 1 THEN 'COONOOR'
    WHEN b.bus_number = '783UD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '783UD' AND s.stop_order = 4 THEN 'UDUMALPET'
    WHEN b.bus_number = '664MUD' AND s.stop_order = 1 THEN 'COONOOR'
    WHEN b.bus_number = '664MUD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664MUD' AND s.stop_order = 3 THEN 'KOVILPATTI BYPASS BS'
    WHEN b.bus_number = '505CBEB' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '664UD' AND s.stop_order = 1 THEN 'COONOOR'
    WHEN b.bus_number = '664UD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664UD' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '664UD' AND s.stop_order = 2 THEN 'PALLADAM BS'
    WHEN b.bus_number = '505CBEB' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '497' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835C' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835D' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '900A' AND s.stop_order = 0 THEN 'UKKADAM BS'
    WHEN b.bus_number = '187' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '157X' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '114B' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '157L' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '157H' AND s.stop_order = 0 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '668UD' AND s.stop_order = 1 THEN 'KODUMUDI'
    WHEN b.bus_number = '39201' AND s.stop_order = 1 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '892UD' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '892UD' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '892UD' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '892UD' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '026P' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '142A1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '143A1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '144A2' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '144E2' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '26L' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '26V' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '845A1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '142A2' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '845K1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '142A3' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '303A1' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '144E2' AND s.stop_order = 0 THEN 'ARAPALAYAM BS'
    WHEN b.bus_number = '567EX' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '499B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '238A1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '567B' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '982UD' AND s.stop_order = 1 THEN 'THENKASI'
    WHEN b.bus_number = '982UD' AND s.stop_order = 2 THEN 'KADAYA NALLUR'
    WHEN b.bus_number = '982UD' AND s.stop_order = 3 THEN 'PULIYANKUDI'
    WHEN b.bus_number = '982UD' AND s.stop_order = 4 THEN 'RAJAPALAYAM NEW BS'
    WHEN b.bus_number = '982UD' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 1 THEN 'KAYALPATTINAM'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 2 THEN 'ARUMUGANERI'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 3 THEN 'ATHUR(TNV)'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 4 THEN 'SPIC NAGAR'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 1 THEN 'KAYALPATTINAM'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 2 THEN 'ARUMUGANERI'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 3 THEN 'ATHUR(TNV)'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 4 THEN 'SPIC NAGAR'
    WHEN b.bus_number = '847EUD' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '847ENS' AND s.stop_order = 1 THEN 'KAYALPATTINAM'
    WHEN b.bus_number = '847ENS' AND s.stop_order = 2 THEN 'ARUMUGANERI'
    WHEN b.bus_number = '847ENS' AND s.stop_order = 3 THEN 'ATHUR(TNV)'
    WHEN b.bus_number = '847ENS' AND s.stop_order = 4 THEN 'SPIC NAGAR'
    WHEN b.bus_number = '847ENS' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505A1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '995UD' AND s.stop_order = 4 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '995UD' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '531UD' AND s.stop_order = 3 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '531UD' AND s.stop_order = 5 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '531MUD' AND s.stop_order = 3 THEN 'MYLADUTHURAI'
    WHEN b.bus_number = '531MUD' AND s.stop_order = 6 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505A3' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505E1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '153T1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505G1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXC' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXA' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXD' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505J1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505R' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505Q' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505DLXB' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '146A1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505E2' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '505M1' AND s.stop_order = 0 THEN 'MATTUTHAVANI BS'
    WHEN b.bus_number = '157C' AND s.stop_order = 1 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '157O' AND s.stop_order = 1 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '157V' AND s.stop_order = 1 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '722UD' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '625UD' AND s.stop_order = 1 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '215A' AND s.stop_order = 1 THEN 'GANDHIPURAM CBS'
    WHEN b.bus_number = '796UD' AND s.stop_order = 1 THEN 'ANDALUR GATE'
    WHEN b.bus_number = '796UD' AND s.stop_order = 2 THEN 'NAMAKKAL'
    WHEN b.bus_number = '687UD' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '687UD' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '687UD' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '892NS' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '892NS' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '892NS' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '892NS' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '892NS' AND s.stop_order = 4 THEN 'HOSUR'
    WHEN b.bus_number = '887AB' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '887AB' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '887AB' AND s.stop_order = 2 THEN 'ELECTRONIC TOLL PLAZA'
    WHEN b.bus_number = '887AB' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '887AB' AND s.stop_order = 7 THEN 'VADACHERRY'
    WHEN b.bus_number = '771EUD' AND s.stop_order = 3 THEN 'MALLIPATTINAM'
    WHEN b.bus_number = '33101' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '33102' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '505TPR3' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '505TPR4' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '42902' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '505TPR5' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '505TPR1' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '505TPRB' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '42901' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '669UD' AND s.stop_order = 0 THEN 'TIRUPPUR OLD BUS STAND'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 2 THEN 'TIRUPPUR OLD BUSSTAND'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 3 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '22602' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '411AM' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '911J' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '647A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805T' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '908JJ' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909K' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '911T' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '963A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805H' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533C' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '931A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909G' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909Q' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '534A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909B' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '003A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533AB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '533D' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909H' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '909L' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '805M' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505TRYB' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '624A' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125UD' AND s.stop_order = 1 THEN 'VIRALIMALAI TOLL PLAZA'
    WHEN b.bus_number = '125AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125AC' AND s.stop_order = 1 THEN 'VIRALIMALAI TOLL PLAZA'
    WHEN b.bus_number = '505TCY' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '505TRYA' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125UD' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125UD' AND s.stop_order = 1 THEN 'VIRALIMALAI TOLL PLAZA'
    WHEN b.bus_number = '125AC' AND s.stop_order = 0 THEN 'TRICHY KKBT'
    WHEN b.bus_number = '125AC' AND s.stop_order = 1 THEN 'VIRALIMALAI TOLL PLAZA'
    WHEN b.bus_number = '290B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AH' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AJ' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '308A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AI' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AG' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AE' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281X' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177O' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177N' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '168A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '321A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AF' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281Y' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281Z' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '273A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177W' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '273B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177S' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AA' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177V' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '122D' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177R' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205A' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177X' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AE' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281P' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '122E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177AF' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177C' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AH' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '171B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177Z' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '177F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '281AG' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205K' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205O' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '201J' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '303AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '303UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '201' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '303UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '303NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '794UD' AND s.stop_order = 7)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 0)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 1)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 2)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 3)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 4)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 5)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 6)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 7)
  OR   (b.bus_number = 'H198NS' AND s.stop_order = 9)
  OR   (b.bus_number = '198AB' AND s.stop_order = 0)
  OR   (b.bus_number = '198AB' AND s.stop_order = 1)
  OR   (b.bus_number = '198AB' AND s.stop_order = 2)
  OR   (b.bus_number = '198AB' AND s.stop_order = 3)
  OR   (b.bus_number = '198AB' AND s.stop_order = 4)
  OR   (b.bus_number = '198AB' AND s.stop_order = 5)
  OR   (b.bus_number = '198AB' AND s.stop_order = 6)
  OR   (b.bus_number = '198AB' AND s.stop_order = 7)
  OR   (b.bus_number = '284NS' AND s.stop_order = 0)
  OR   (b.bus_number = '284NS' AND s.stop_order = 1)
  OR   (b.bus_number = '284NS' AND s.stop_order = 2)
  OR   (b.bus_number = '284NS' AND s.stop_order = 3)
  OR   (b.bus_number = '284NS' AND s.stop_order = 4)
  OR   (b.bus_number = '284NS' AND s.stop_order = 5)
  OR   (b.bus_number = '284NS' AND s.stop_order = 6)
  OR   (b.bus_number = '284NS' AND s.stop_order = 7)
  OR   (b.bus_number = '284NS' AND s.stop_order = 8)
  OR   (b.bus_number = '284UD' AND s.stop_order = 0)
  OR   (b.bus_number = '284UD' AND s.stop_order = 1)
  OR   (b.bus_number = '284UD' AND s.stop_order = 2)
  OR   (b.bus_number = '284UD' AND s.stop_order = 3)
  OR   (b.bus_number = '284UD' AND s.stop_order = 4)
  OR   (b.bus_number = '284UD' AND s.stop_order = 5)
  OR   (b.bus_number = '284UD' AND s.stop_order = 6)
  OR   (b.bus_number = '284UD' AND s.stop_order = 7)
  OR   (b.bus_number = '284UD' AND s.stop_order = 8)
  OR   (b.bus_number = '198NS' AND s.stop_order = 0)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '198NS' AND s.stop_order = 6)
  OR   (b.bus_number = '198NS' AND s.stop_order = 7)
  OR   (b.bus_number = '198NS' AND s.stop_order = 8)
  OR   (b.bus_number = '198MS' AND s.stop_order = 0)
  OR   (b.bus_number = '198MS' AND s.stop_order = 1)
  OR   (b.bus_number = '198MS' AND s.stop_order = 2)
  OR   (b.bus_number = '198MS' AND s.stop_order = 3)
  OR   (b.bus_number = '198MS' AND s.stop_order = 4)
  OR   (b.bus_number = '198MS' AND s.stop_order = 5)
  OR   (b.bus_number = '198MS' AND s.stop_order = 6)
  OR   (b.bus_number = '198MS' AND s.stop_order = 7)
  OR   (b.bus_number = '198MS' AND s.stop_order = 8)
  OR   (b.bus_number = '198MS' AND s.stop_order = 9)
  OR   (b.bus_number = '198AB' AND s.stop_order = 0)
  OR   (b.bus_number = '198AB' AND s.stop_order = 1)
  OR   (b.bus_number = '198AB' AND s.stop_order = 2)
  OR   (b.bus_number = '198AB' AND s.stop_order = 3)
  OR   (b.bus_number = '198AB' AND s.stop_order = 4)
  OR   (b.bus_number = '198AB' AND s.stop_order = 5)
  OR   (b.bus_number = '198AB' AND s.stop_order = 6)
  OR   (b.bus_number = '198AB' AND s.stop_order = 7)
  OR   (b.bus_number = '198AB' AND s.stop_order = 8)
  OR   (b.bus_number = '198NS' AND s.stop_order = 0)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '198NS' AND s.stop_order = 6)
  OR   (b.bus_number = '198NS' AND s.stop_order = 7)
  OR   (b.bus_number = '198NS' AND s.stop_order = 8)
  OR   (b.bus_number = '198LB' AND s.stop_order = 0)
  OR   (b.bus_number = '198LB' AND s.stop_order = 1)
  OR   (b.bus_number = '198LB' AND s.stop_order = 2)
  OR   (b.bus_number = '198LB' AND s.stop_order = 3)
  OR   (b.bus_number = '198LB' AND s.stop_order = 4)
  OR   (b.bus_number = '198LB' AND s.stop_order = 5)
  OR   (b.bus_number = '198LB' AND s.stop_order = 6)
  OR   (b.bus_number = '198LB' AND s.stop_order = 7)
  OR   (b.bus_number = '198LB' AND s.stop_order = 8)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 0)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 1)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 2)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 3)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 4)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 5)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 6)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 7)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 8)
  OR   (b.bus_number = 'H198UD' AND s.stop_order = 10)
  OR   (b.bus_number = '198NS' AND s.stop_order = 0)
  OR   (b.bus_number = '198NS' AND s.stop_order = 1)
  OR   (b.bus_number = '198NS' AND s.stop_order = 2)
  OR   (b.bus_number = '198NS' AND s.stop_order = 3)
  OR   (b.bus_number = '198NS' AND s.stop_order = 4)
  OR   (b.bus_number = '198NS' AND s.stop_order = 5)
  OR   (b.bus_number = '198NS' AND s.stop_order = 6)
  OR   (b.bus_number = '198NS' AND s.stop_order = 7)
  OR   (b.bus_number = '198NS' AND s.stop_order = 8)
  OR   (b.bus_number = '675E' AND s.stop_order = 0)
  OR   (b.bus_number = '675C' AND s.stop_order = 0)
  OR   (b.bus_number = '675D' AND s.stop_order = 0)
  OR   (b.bus_number = '675F' AND s.stop_order = 0)
  OR   (b.bus_number = '675A' AND s.stop_order = 0)
  OR   (b.bus_number = '425NS' AND s.stop_order = 0)
  OR   (b.bus_number = '425NS' AND s.stop_order = 1)
  OR   (b.bus_number = '425NS' AND s.stop_order = 2)
  OR   (b.bus_number = '425NS' AND s.stop_order = 3)
  OR   (b.bus_number = '425NS' AND s.stop_order = 4)
  OR   (b.bus_number = '425NS' AND s.stop_order = 5)
  OR   (b.bus_number = '425NS' AND s.stop_order = 6)
  OR   (b.bus_number = '425NS' AND s.stop_order = 7)
  OR   (b.bus_number = '425NS' AND s.stop_order = 8)
  OR   (b.bus_number = '425NS' AND s.stop_order = 9)
  OR   (b.bus_number = '675B' AND s.stop_order = 0)
  OR   (b.bus_number = '425UD' AND s.stop_order = 0)
  OR   (b.bus_number = '425UD' AND s.stop_order = 1)
  OR   (b.bus_number = '425UD' AND s.stop_order = 2)
  OR   (b.bus_number = '425UD' AND s.stop_order = 3)
  OR   (b.bus_number = '425UD' AND s.stop_order = 4)
  OR   (b.bus_number = '425UD' AND s.stop_order = 5)
  OR   (b.bus_number = '425UD' AND s.stop_order = 6)
  OR   (b.bus_number = '425UD' AND s.stop_order = 7)
  OR   (b.bus_number = '425UD' AND s.stop_order = 8)
  OR   (b.bus_number = '425UD' AND s.stop_order = 9)
  OR   (b.bus_number = '425AB' AND s.stop_order = 0)
  OR   (b.bus_number = '425AB' AND s.stop_order = 1)
  OR   (b.bus_number = '425AB' AND s.stop_order = 2)
  OR   (b.bus_number = '425AB' AND s.stop_order = 3)
  OR   (b.bus_number = '425AB' AND s.stop_order = 4)
  OR   (b.bus_number = '425AB' AND s.stop_order = 5)
  OR   (b.bus_number = '425AB' AND s.stop_order = 6)
  OR   (b.bus_number = '425AB' AND s.stop_order = 7)
  OR   (b.bus_number = '425AB' AND s.stop_order = 8)
  OR   (b.bus_number = '133AC' AND s.stop_order = 0)
  OR   (b.bus_number = '133AC' AND s.stop_order = 1)
  OR   (b.bus_number = '133AC' AND s.stop_order = 2)
  OR   (b.bus_number = '133AC' AND s.stop_order = 3)
  OR   (b.bus_number = '133AC' AND s.stop_order = 4)
  OR   (b.bus_number = '133AC' AND s.stop_order = 5)
  OR   (b.bus_number = '133AC' AND s.stop_order = 6)
  OR   (b.bus_number = '133AC' AND s.stop_order = 7)
  OR   (b.bus_number = '133AC' AND s.stop_order = 8)
  OR   (b.bus_number = '174UD' AND s.stop_order = 0)
  OR   (b.bus_number = '174UD' AND s.stop_order = 1)
  OR   (b.bus_number = '174UD' AND s.stop_order = 2)
  OR   (b.bus_number = '174UD' AND s.stop_order = 3)
  OR   (b.bus_number = '174UD' AND s.stop_order = 4)
  OR   (b.bus_number = '174UD' AND s.stop_order = 5)
  OR   (b.bus_number = '174UD' AND s.stop_order = 6)
  OR   (b.bus_number = '174UD' AND s.stop_order = 7)
  OR   (b.bus_number = '131LB' AND s.stop_order = 0)
  OR   (b.bus_number = '131LB' AND s.stop_order = 1)
  OR   (b.bus_number = '131LB' AND s.stop_order = 2)
  OR   (b.bus_number = '131LB' AND s.stop_order = 3)
  OR   (b.bus_number = '131LB' AND s.stop_order = 4)
  OR   (b.bus_number = '131LB' AND s.stop_order = 5)
  OR   (b.bus_number = '131LB' AND s.stop_order = 6)
  OR   (b.bus_number = '131LB' AND s.stop_order = 7)
  OR   (b.bus_number = '131LB' AND s.stop_order = 8)
  OR   (b.bus_number = '131LB' AND s.stop_order = 9)
  OR   (b.bus_number = '126NS' AND s.stop_order = 0)
  OR   (b.bus_number = '126NS' AND s.stop_order = 1)
  OR   (b.bus_number = '126NS' AND s.stop_order = 2)
  OR   (b.bus_number = '126NS' AND s.stop_order = 3)
  OR   (b.bus_number = '126NS' AND s.stop_order = 4)
  OR   (b.bus_number = '126NS' AND s.stop_order = 5)
  OR   (b.bus_number = '126NS' AND s.stop_order = 6)
  OR   (b.bus_number = '126NS' AND s.stop_order = 7)
  OR   (b.bus_number = '126NS' AND s.stop_order = 8)
  OR   (b.bus_number = '155UD' AND s.stop_order = 0)
  OR   (b.bus_number = '155UD' AND s.stop_order = 1)
  OR   (b.bus_number = '155UD' AND s.stop_order = 2)
  OR   (b.bus_number = '155UD' AND s.stop_order = 3)
  OR   (b.bus_number = '155UD' AND s.stop_order = 4)
  OR   (b.bus_number = '155UD' AND s.stop_order = 5)
  OR   (b.bus_number = '155UD' AND s.stop_order = 6)
  OR   (b.bus_number = '155UD' AND s.stop_order = 7)
  OR   (b.bus_number = '155UD' AND s.stop_order = 8)
  OR   (b.bus_number = '136NS' AND s.stop_order = 0)
  OR   (b.bus_number = '136NS' AND s.stop_order = 1)
  OR   (b.bus_number = '136NS' AND s.stop_order = 2)
  OR   (b.bus_number = '136NS' AND s.stop_order = 3)
  OR   (b.bus_number = '136NS' AND s.stop_order = 4)
  OR   (b.bus_number = '136NS' AND s.stop_order = 5)
  OR   (b.bus_number = '136NS' AND s.stop_order = 6)
  OR   (b.bus_number = '136NS' AND s.stop_order = 7)
  OR   (b.bus_number = '136NS' AND s.stop_order = 8)
  OR   (b.bus_number = '133AC' AND s.stop_order = 0)
  OR   (b.bus_number = '133AC' AND s.stop_order = 1)
  OR   (b.bus_number = '133AC' AND s.stop_order = 2)
  OR   (b.bus_number = '133AC' AND s.stop_order = 3)
  OR   (b.bus_number = '133AC' AND s.stop_order = 4)
  OR   (b.bus_number = '133AC' AND s.stop_order = 5)
  OR   (b.bus_number = '133AC' AND s.stop_order = 6)
  OR   (b.bus_number = '133AC' AND s.stop_order = 7)
  OR   (b.bus_number = '133AC' AND s.stop_order = 8)
  OR   (b.bus_number = '144UD' AND s.stop_order = 0)
  OR   (b.bus_number = '144UD' AND s.stop_order = 1)
  OR   (b.bus_number = '144UD' AND s.stop_order = 2)
  OR   (b.bus_number = '144UD' AND s.stop_order = 3)
  OR   (b.bus_number = '144UD' AND s.stop_order = 4)
  OR   (b.bus_number = '144UD' AND s.stop_order = 5)
  OR   (b.bus_number = '144UD' AND s.stop_order = 6)
  OR   (b.bus_number = '144UD' AND s.stop_order = 7)
  OR   (b.bus_number = '144UD' AND s.stop_order = 8)
  OR   (b.bus_number = '136UD' AND s.stop_order = 0)
  OR   (b.bus_number = '136UD' AND s.stop_order = 1)
  OR   (b.bus_number = '136UD' AND s.stop_order = 2)
  OR   (b.bus_number = '136UD' AND s.stop_order = 3)
  OR   (b.bus_number = '136UD' AND s.stop_order = 4)
  OR   (b.bus_number = '136UD' AND s.stop_order = 5)
  OR   (b.bus_number = '136UD' AND s.stop_order = 6)
  OR   (b.bus_number = '136UD' AND s.stop_order = 7)
  OR   (b.bus_number = '133NS' AND s.stop_order = 0)
  OR   (b.bus_number = '133NS' AND s.stop_order = 1)
  OR   (b.bus_number = '133NS' AND s.stop_order = 2)
  OR   (b.bus_number = '133NS' AND s.stop_order = 3)
  OR   (b.bus_number = '133NS' AND s.stop_order = 4)
  OR   (b.bus_number = '133NS' AND s.stop_order = 5)
  OR   (b.bus_number = '133NS' AND s.stop_order = 6)
  OR   (b.bus_number = '126AC' AND s.stop_order = 0)
  OR   (b.bus_number = '537A' AND s.stop_order = 0)
  OR   (b.bus_number = '839AC' AND s.stop_order = 0)
  OR   (b.bus_number = '839AC' AND s.stop_order = 2)
  OR   (b.bus_number = '842UD' AND s.stop_order = 0)
  OR   (b.bus_number = '842UD' AND s.stop_order = 1)
  OR   (b.bus_number = '842UD' AND s.stop_order = 2)
  OR   (b.bus_number = '839UD' AND s.stop_order = 1)
  OR   (b.bus_number = '457I' AND s.stop_order = 0)
  OR   (b.bus_number = '505CBEEF' AND s.stop_order = 0)
  OR   (b.bus_number = '783UD' AND s.stop_order = 1)
  OR   (b.bus_number = '783UD' AND s.stop_order = 2)
  OR   (b.bus_number = '783UD' AND s.stop_order = 4)
  OR   (b.bus_number = '664MUD' AND s.stop_order = 1)
  OR   (b.bus_number = '664MUD' AND s.stop_order = 2)
  OR   (b.bus_number = '664MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '505CBEB' AND s.stop_order = 0)
  OR   (b.bus_number = '664UD' AND s.stop_order = 1)
  OR   (b.bus_number = '664UD' AND s.stop_order = 2)
  OR   (b.bus_number = '664UD' AND s.stop_order = 1)
  OR   (b.bus_number = '664UD' AND s.stop_order = 2)
  OR   (b.bus_number = '505CBEB' AND s.stop_order = 0)
  OR   (b.bus_number = '497' AND s.stop_order = 0)
  OR   (b.bus_number = '835C' AND s.stop_order = 0)
  OR   (b.bus_number = '835A' AND s.stop_order = 0)
  OR   (b.bus_number = '835D' AND s.stop_order = 0)
  OR   (b.bus_number = '900A' AND s.stop_order = 0)
  OR   (b.bus_number = '187' AND s.stop_order = 0)
  OR   (b.bus_number = '835B' AND s.stop_order = 0)
  OR   (b.bus_number = '157X' AND s.stop_order = 0)
  OR   (b.bus_number = '114B' AND s.stop_order = 0)
  OR   (b.bus_number = '157L' AND s.stop_order = 0)
  OR   (b.bus_number = '157H' AND s.stop_order = 0)
  OR   (b.bus_number = '668UD' AND s.stop_order = 1)
  OR   (b.bus_number = '39201' AND s.stop_order = 1)
  OR   (b.bus_number = '892UD' AND s.stop_order = 0)
  OR   (b.bus_number = '892UD' AND s.stop_order = 1)
  OR   (b.bus_number = '892UD' AND s.stop_order = 2)
  OR   (b.bus_number = '892UD' AND s.stop_order = 3)
  OR   (b.bus_number = '026P' AND s.stop_order = 0)
  OR   (b.bus_number = '142A1' AND s.stop_order = 0)
  OR   (b.bus_number = '143A1' AND s.stop_order = 0)
  OR   (b.bus_number = '144A2' AND s.stop_order = 0)
  OR   (b.bus_number = '144E2' AND s.stop_order = 0)
  OR   (b.bus_number = '26L' AND s.stop_order = 0)
  OR   (b.bus_number = '26V' AND s.stop_order = 0)
  OR   (b.bus_number = '845A1' AND s.stop_order = 0)
  OR   (b.bus_number = '142A2' AND s.stop_order = 0)
  OR   (b.bus_number = '845K1' AND s.stop_order = 0)
  OR   (b.bus_number = '142A3' AND s.stop_order = 0)
  OR   (b.bus_number = '303A1' AND s.stop_order = 0)
  OR   (b.bus_number = '144E2' AND s.stop_order = 0)
  OR   (b.bus_number = '567EX' AND s.stop_order = 0)
  OR   (b.bus_number = '499B' AND s.stop_order = 0)
  OR   (b.bus_number = '238A1' AND s.stop_order = 0)
  OR   (b.bus_number = '567B' AND s.stop_order = 0)
  OR   (b.bus_number = '982UD' AND s.stop_order = 1)
  OR   (b.bus_number = '982UD' AND s.stop_order = 2)
  OR   (b.bus_number = '982UD' AND s.stop_order = 3)
  OR   (b.bus_number = '982UD' AND s.stop_order = 4)
  OR   (b.bus_number = '982UD' AND s.stop_order = 5)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 6)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 2)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 4)
  OR   (b.bus_number = '847EUD' AND s.stop_order = 6)
  OR   (b.bus_number = '847ENS' AND s.stop_order = 1)
  OR   (b.bus_number = '847ENS' AND s.stop_order = 2)
  OR   (b.bus_number = '847ENS' AND s.stop_order = 3)
  OR   (b.bus_number = '847ENS' AND s.stop_order = 4)
  OR   (b.bus_number = '847ENS' AND s.stop_order = 6)
  OR   (b.bus_number = '505A1' AND s.stop_order = 0)
  OR   (b.bus_number = '995UD' AND s.stop_order = 4)
  OR   (b.bus_number = '995UD' AND s.stop_order = 5)
  OR   (b.bus_number = '531UD' AND s.stop_order = 3)
  OR   (b.bus_number = '531UD' AND s.stop_order = 5)
  OR   (b.bus_number = '531MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '531MUD' AND s.stop_order = 6)
  OR   (b.bus_number = '505A3' AND s.stop_order = 0)
  OR   (b.bus_number = '505E1' AND s.stop_order = 0)
  OR   (b.bus_number = '153T1' AND s.stop_order = 0)
  OR   (b.bus_number = '505G1' AND s.stop_order = 0)
  OR   (b.bus_number = '505DLXC' AND s.stop_order = 0)
  OR   (b.bus_number = '505DLXA' AND s.stop_order = 0)
  OR   (b.bus_number = '505DLXD' AND s.stop_order = 0)
  OR   (b.bus_number = '505J1' AND s.stop_order = 0)
  OR   (b.bus_number = '505DLXB' AND s.stop_order = 0)
  OR   (b.bus_number = '505R' AND s.stop_order = 0)
  OR   (b.bus_number = '505Q' AND s.stop_order = 0)
  OR   (b.bus_number = '505DLXB' AND s.stop_order = 0)
  OR   (b.bus_number = '146A1' AND s.stop_order = 0)
  OR   (b.bus_number = '505E2' AND s.stop_order = 0)
  OR   (b.bus_number = '505M1' AND s.stop_order = 0)
  OR   (b.bus_number = '157C' AND s.stop_order = 1)
  OR   (b.bus_number = '157O' AND s.stop_order = 1)
  OR   (b.bus_number = '157V' AND s.stop_order = 1)
  OR   (b.bus_number = '722UD' AND s.stop_order = 1)
  OR   (b.bus_number = '625UD' AND s.stop_order = 1)
  OR   (b.bus_number = '215A' AND s.stop_order = 1)
  OR   (b.bus_number = '796UD' AND s.stop_order = 1)
  OR   (b.bus_number = '796UD' AND s.stop_order = 2)
  OR   (b.bus_number = '687UD' AND s.stop_order = 0)
  OR   (b.bus_number = '687UD' AND s.stop_order = 1)
  OR   (b.bus_number = '687UD' AND s.stop_order = 2)
  OR   (b.bus_number = '892NS' AND s.stop_order = 0)
  OR   (b.bus_number = '892NS' AND s.stop_order = 1)
  OR   (b.bus_number = '892NS' AND s.stop_order = 2)
  OR   (b.bus_number = '892NS' AND s.stop_order = 3)
  OR   (b.bus_number = '892NS' AND s.stop_order = 4)
  OR   (b.bus_number = '887AB' AND s.stop_order = 0)
  OR   (b.bus_number = '887AB' AND s.stop_order = 1)
  OR   (b.bus_number = '887AB' AND s.stop_order = 2)
  OR   (b.bus_number = '887AB' AND s.stop_order = 3)
  OR   (b.bus_number = '887AB' AND s.stop_order = 7)
  OR   (b.bus_number = '771EUD' AND s.stop_order = 3)
  OR   (b.bus_number = '33101' AND s.stop_order = 0)
  OR   (b.bus_number = '33102' AND s.stop_order = 0)
  OR   (b.bus_number = '505TPR3' AND s.stop_order = 0)
  OR   (b.bus_number = '505TPR4' AND s.stop_order = 0)
  OR   (b.bus_number = '42902' AND s.stop_order = 0)
  OR   (b.bus_number = '505TPR5' AND s.stop_order = 0)
  OR   (b.bus_number = '505TPR1' AND s.stop_order = 0)
  OR   (b.bus_number = '505TPRB' AND s.stop_order = 0)
  OR   (b.bus_number = '42901' AND s.stop_order = 0)
  OR   (b.bus_number = '669UD' AND s.stop_order = 0)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 2)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 3)
  OR   (b.bus_number = '22602' AND s.stop_order = 0)
  OR   (b.bus_number = '411AM' AND s.stop_order = 0)
  OR   (b.bus_number = '911J' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '647A' AND s.stop_order = 0)
  OR   (b.bus_number = '805T' AND s.stop_order = 0)
  OR   (b.bus_number = '908JJ' AND s.stop_order = 0)
  OR   (b.bus_number = '909K' AND s.stop_order = 0)
  OR   (b.bus_number = '533' AND s.stop_order = 0)
  OR   (b.bus_number = '911T' AND s.stop_order = 0)
  OR   (b.bus_number = '963A' AND s.stop_order = 0)
  OR   (b.bus_number = '805H' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '533C' AND s.stop_order = 0)
  OR   (b.bus_number = '931A' AND s.stop_order = 0)
  OR   (b.bus_number = '909G' AND s.stop_order = 0)
  OR   (b.bus_number = '909Q' AND s.stop_order = 0)
  OR   (b.bus_number = '534A' AND s.stop_order = 0)
  OR   (b.bus_number = '533' AND s.stop_order = 0)
  OR   (b.bus_number = '909B' AND s.stop_order = 0)
  OR   (b.bus_number = '003A' AND s.stop_order = 0)
  OR   (b.bus_number = '533AB' AND s.stop_order = 0)
  OR   (b.bus_number = '533D' AND s.stop_order = 0)
  OR   (b.bus_number = '909H' AND s.stop_order = 0)
  OR   (b.bus_number = '909L' AND s.stop_order = 0)
  OR   (b.bus_number = '805M' AND s.stop_order = 0)
  OR   (b.bus_number = '505TRYB' AND s.stop_order = 0)
  OR   (b.bus_number = '624A' AND s.stop_order = 0)
  OR   (b.bus_number = '125UD' AND s.stop_order = 0)
  OR   (b.bus_number = '125UD' AND s.stop_order = 1)
  OR   (b.bus_number = '125AC' AND s.stop_order = 0)
  OR   (b.bus_number = '125AC' AND s.stop_order = 1)
  OR   (b.bus_number = '505TCY' AND s.stop_order = 0)
  OR   (b.bus_number = '505TRYA' AND s.stop_order = 0)
  OR   (b.bus_number = '125UD' AND s.stop_order = 0)
  OR   (b.bus_number = '125UD' AND s.stop_order = 1)
  OR   (b.bus_number = '125AC' AND s.stop_order = 0)
  OR   (b.bus_number = '125AC' AND s.stop_order = 1)
  OR   (b.bus_number = '290B' AND s.stop_order = 0)
  OR   (b.bus_number = '177AH' AND s.stop_order = 0)
  OR   (b.bus_number = '281AJ' AND s.stop_order = 0)
  OR   (b.bus_number = '177B' AND s.stop_order = 0)
  OR   (b.bus_number = '308A' AND s.stop_order = 0)
  OR   (b.bus_number = '177G' AND s.stop_order = 0)
  OR   (b.bus_number = '281AI' AND s.stop_order = 0)
  OR   (b.bus_number = '177AG' AND s.stop_order = 0)
  OR   (b.bus_number = '281AE' AND s.stop_order = 0)
  OR   (b.bus_number = '177H' AND s.stop_order = 0)
  OR   (b.bus_number = '177J' AND s.stop_order = 0)
  OR   (b.bus_number = '281AD' AND s.stop_order = 0)
  OR   (b.bus_number = '281X' AND s.stop_order = 0)
  OR   (b.bus_number = '177O' AND s.stop_order = 0)
  OR   (b.bus_number = '177N' AND s.stop_order = 0)
  OR   (b.bus_number = '168A' AND s.stop_order = 0)
  OR   (b.bus_number = '321A' AND s.stop_order = 0)
  OR   (b.bus_number = '281AF' AND s.stop_order = 0)
  OR   (b.bus_number = '177AC' AND s.stop_order = 0)
  OR   (b.bus_number = '281Y' AND s.stop_order = 0)
  OR   (b.bus_number = '281Z' AND s.stop_order = 0)
  OR   (b.bus_number = '273A' AND s.stop_order = 0)
  OR   (b.bus_number = '177W' AND s.stop_order = 0)
  OR   (b.bus_number = '177K' AND s.stop_order = 0)
  OR   (b.bus_number = '273B' AND s.stop_order = 0)
  OR   (b.bus_number = '177A' AND s.stop_order = 0)
  OR   (b.bus_number = '177S' AND s.stop_order = 0)
  OR   (b.bus_number = '177AA' AND s.stop_order = 0)
  OR   (b.bus_number = '177V' AND s.stop_order = 0)
  OR   (b.bus_number = '177AD' AND s.stop_order = 0)
  OR   (b.bus_number = '122D' AND s.stop_order = 0)
  OR   (b.bus_number = '177R' AND s.stop_order = 0)
  OR   (b.bus_number = '205A' AND s.stop_order = 0)
  OR   (b.bus_number = '177X' AND s.stop_order = 0)
  OR   (b.bus_number = '177AE' AND s.stop_order = 0)
  OR   (b.bus_number = '281P' AND s.stop_order = 0)
  OR   (b.bus_number = '122E' AND s.stop_order = 0)
  OR   (b.bus_number = '177AF' AND s.stop_order = 0)
  OR   (b.bus_number = '177C' AND s.stop_order = 0)
  OR   (b.bus_number = '281AH' AND s.stop_order = 0)
  OR   (b.bus_number = '171B' AND s.stop_order = 0)
  OR   (b.bus_number = '177E' AND s.stop_order = 0)
  OR   (b.bus_number = '177Z' AND s.stop_order = 0)
  OR   (b.bus_number = '281AB' AND s.stop_order = 0)
  OR   (b.bus_number = '177F' AND s.stop_order = 0)
  OR   (b.bus_number = '281AG' AND s.stop_order = 0)
  OR   (b.bus_number = '205K' AND s.stop_order = 0)
  OR   (b.bus_number = '205K' AND s.stop_order = 0)
  OR   (b.bus_number = '205J' AND s.stop_order = 0)
  OR   (b.bus_number = '205O' AND s.stop_order = 0)
  OR   (b.bus_number = '201J' AND s.stop_order = 0)
  OR   (b.bus_number = '303UD' AND s.stop_order = 0)
  OR   (b.bus_number = '303UD' AND s.stop_order = 1)
  OR   (b.bus_number = '303UD' AND s.stop_order = 2)
  OR   (b.bus_number = '303UD' AND s.stop_order = 3)
  OR   (b.bus_number = '303UD' AND s.stop_order = 4)
  OR   (b.bus_number = '303UD' AND s.stop_order = 5)
  OR   (b.bus_number = '303UD' AND s.stop_order = 6)
  OR   (b.bus_number = '303UD' AND s.stop_order = 7)
  OR   (b.bus_number = '303UD' AND s.stop_order = 8)
  OR   (b.bus_number = '303AC' AND s.stop_order = 0)
  OR   (b.bus_number = '303AC' AND s.stop_order = 1)
  OR   (b.bus_number = '303AC' AND s.stop_order = 2)
  OR   (b.bus_number = '303AC' AND s.stop_order = 3)
  OR   (b.bus_number = '303AC' AND s.stop_order = 4)
  OR   (b.bus_number = '303AC' AND s.stop_order = 5)
  OR   (b.bus_number = '303AC' AND s.stop_order = 6)
  OR   (b.bus_number = '303AC' AND s.stop_order = 7)
  OR   (b.bus_number = '303AC' AND s.stop_order = 8)
  OR   (b.bus_number = '303UD' AND s.stop_order = 0)
  OR   (b.bus_number = '303UD' AND s.stop_order = 1)
  OR   (b.bus_number = '303UD' AND s.stop_order = 2)
  OR   (b.bus_number = '303UD' AND s.stop_order = 3)
  OR   (b.bus_number = '303UD' AND s.stop_order = 4)
  OR   (b.bus_number = '303UD' AND s.stop_order = 5)
  OR   (b.bus_number = '303UD' AND s.stop_order = 6)
  OR   (b.bus_number = '303UD' AND s.stop_order = 7)
  OR   (b.bus_number = '303UD' AND s.stop_order = 8)
  OR   (b.bus_number = '201' AND s.stop_order = 0)
  OR   (b.bus_number = '303NS' AND s.stop_order = 0)
  OR   (b.bus_number = '303NS' AND s.stop_order = 1)
  OR   (b.bus_number = '303NS' AND s.stop_order = 2)
  OR   (b.bus_number = '303NS' AND s.stop_order = 3)
  OR   (b.bus_number = '303NS' AND s.stop_order = 4)
  OR   (b.bus_number = '303NS' AND s.stop_order = 5)
  OR   (b.bus_number = '303NS' AND s.stop_order = 6)
  OR   (b.bus_number = '303AB' AND s.stop_order = 0)
  OR   (b.bus_number = '303AB' AND s.stop_order = 1)
  OR   (b.bus_number = '303AB' AND s.stop_order = 2)
  OR   (b.bus_number = '303AB' AND s.stop_order = 3)
  OR   (b.bus_number = '303AB' AND s.stop_order = 4)
  OR   (b.bus_number = '303AB' AND s.stop_order = 5)
  OR   (b.bus_number = '303AB' AND s.stop_order = 6)
  OR   (b.bus_number = '303AB' AND s.stop_order = 7)
  OR   (b.bus_number = '303AB' AND s.stop_order = 8)
  OR   (b.bus_number = '303UD' AND s.stop_order = 0)
  OR   (b.bus_number = '303UD' AND s.stop_order = 1)
  OR   (b.bus_number = '303UD' AND s.stop_order = 2)
  OR   (b.bus_number = '303UD' AND s.stop_order = 3)
  OR   (b.bus_number = '303UD' AND s.stop_order = 4)
  OR   (b.bus_number = '303UD' AND s.stop_order = 5)
  OR   (b.bus_number = '303UD' AND s.stop_order = 6)
  OR   (b.bus_number = '303UD' AND s.stop_order = 7)
  OR   (b.bus_number = '303UD' AND s.stop_order = 8)
  OR   (b.bus_number = '303NS' AND s.stop_order = 0)
  OR   (b.bus_number = '303NS' AND s.stop_order = 1)
  OR   (b.bus_number = '303NS' AND s.stop_order = 2)
);

-- Chunk 9/9 (303 rows)
UPDATE stops s
JOIN buses b ON s.bus_id = b.id
JOIN locations l ON l.name =
  CASE
    WHEN b.bus_number = '303NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '205M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205G' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '205Z' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '224H' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '201B' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AC' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AC' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303AC' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303AC' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303AC' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AC' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303AC' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '205X' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '201M' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '201U' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '333UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '201E' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '303AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '303AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '303AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '303AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '303AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '303AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '501I' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '510F' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '162VUD' AND s.stop_order = 9 THEN 'MANAMADURAI'
    WHEN b.bus_number = '180AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 3 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 4 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 5 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 6 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '190MUD' AND s.stop_order = 7 THEN 'TINDIVANAM'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 1 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 2 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 3 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 4 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 5 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 6 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 7 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 8 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = 'H287UD' AND s.stop_order = 9 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180LB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180LB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180LB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180LB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180LB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180LB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180LB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180LB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180LB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '194UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '194UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '194UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '194UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '194UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '194UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '194UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '194UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '194UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180MS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180MS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180MS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180MS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180MS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180MS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180MS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180MS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180MS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180UD' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180UD' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180UD' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180UD' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180UD' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180UD' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180UD' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180NS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180NS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180NS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180NS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180NS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180NS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180AS' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AS' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180AS' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180AS' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180AS' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180AS' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180AS' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180AS' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '180AS' AND s.stop_order = 8 THEN 'TINDIVANAM'
    WHEN b.bus_number = '180AB' AND s.stop_order = 0 THEN 'CHENNAI KALAIGNAR CBT'
    WHEN b.bus_number = '180AB' AND s.stop_order = 1 THEN 'GUDUVANCHERY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 2 THEN 'SRM UNIVERSITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 3 THEN 'MARAIMALAI NAGAR BUSSTOP'
    WHEN b.bus_number = '180AB' AND s.stop_order = 4 THEN 'MAHINDRA CITY'
    WHEN b.bus_number = '180AB' AND s.stop_order = 5 THEN 'CHENGALPATTU TOLL'
    WHEN b.bus_number = '180AB' AND s.stop_order = 6 THEN 'CHENGALPATTU BYPASS'
    WHEN b.bus_number = '180AB' AND s.stop_order = 7 THEN 'MELMARUVATHUR BUS STOP'
    WHEN b.bus_number = '136G' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136E' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136H' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '829A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '136K' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '536A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '852A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '346' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '601B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '874A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '601A' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 1 THEN 'COONOOR'
    WHEN b.bus_number = '662UD' AND s.stop_order = 2 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 3 THEN 'UKKADAM BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 5 THEN 'UDUMALPET'
    WHEN b.bus_number = '874B' AND s.stop_order = 0 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = 'SPL' AND s.stop_order = 1 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '995A' AND s.stop_order = 0 THEN 'SOLAR NEW BUS STAND'
    WHEN b.bus_number = '664EUD' AND s.stop_order = 1 THEN 'KOTTARAM'
    WHEN b.bus_number = '664EUD' AND s.stop_order = 5 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664KUD' AND s.stop_order = 4 THEN 'KOVILPATTI BYPASS BS'
    WHEN b.bus_number = '664KUD' AND s.stop_order = 5 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '663UD' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '663UD' AND s.stop_order = 4 THEN 'PALANI'
    WHEN b.bus_number = '663UD' AND s.stop_order = 6 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '874HUD' AND s.stop_order = 4 THEN 'VIRUDHUNAGAR NEW BUS STAND'
    WHEN b.bus_number = '783UD' AND s.stop_order = 4 THEN 'PALANI'
    WHEN b.bus_number = '783UD' AND s.stop_order = 5 THEN 'UDUMALPET'
    WHEN b.bus_number = '783UD' AND s.stop_order = 7 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664MUD' AND s.stop_order = 1 THEN 'THUCKKALAY'
    WHEN b.bus_number = '664MUD' AND s.stop_order = 5 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664UD' AND s.stop_order = 0 THEN 'VADACHERRY'
    WHEN b.bus_number = '664UD' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '664UD' AND s.stop_order = 2 THEN 'VALLIYOOR'
    WHEN b.bus_number = '664UD' AND s.stop_order = 3 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '664AVUD' AND s.stop_order = 1 THEN 'ARALVAIMOZHI'
    WHEN b.bus_number = '835B' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '569C' AND s.stop_order = 1 THEN 'UKKADAM BS'
    WHEN b.bus_number = '187' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '497' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835A' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835C' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '835D' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '874PUD' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '874PUD' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '874PUD' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '873UD' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '873UD' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '873UD' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '873UD' AND s.stop_order = 3 THEN 'HOSUR'
    WHEN b.bus_number = '870NS' AND s.stop_order = 0 THEN 'SHANTHI NAGAR BS'
    WHEN b.bus_number = '870NS' AND s.stop_order = 1 THEN 'ST. JOHN HOSPITAL B.S'
    WHEN b.bus_number = '870NS' AND s.stop_order = 2 THEN 'ELECTRONIC CITY BMTC DEPOT'
    WHEN b.bus_number = '870NS' AND s.stop_order = 3 THEN 'ATTIBELE TOLL PLAZA'
    WHEN b.bus_number = '870NS' AND s.stop_order = 6 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '874B' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '666UD' AND s.stop_order = 1 THEN 'VEERAVANALLUR PS BYPASS'
    WHEN b.bus_number = '666UD' AND s.stop_order = 3 THEN 'VANNARPETTAI'
    WHEN b.bus_number = '666UD' AND s.stop_order = 4 THEN 'THACHANALLUR BYPASS'
    WHEN b.bus_number = '666UD' AND s.stop_order = 5 THEN 'SANKAR NAGER'
    WHEN b.bus_number = '666UD' AND s.stop_order = 6 THEN 'KAYATHAR TOLL PLAZA'
    WHEN b.bus_number = '666UD' AND s.stop_order = 7 THEN 'KOVILPATTI BYPASS BS'
    WHEN b.bus_number = '666UD' AND s.stop_order = 8 THEN 'COLLECTOR OFFICE BUS STAND'
    WHEN b.bus_number = '666UD' AND s.stop_order = 9 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '874A' AND s.stop_order = 1 THEN 'SINGANALLUR BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 3 THEN 'KOVILPATTI'
    WHEN b.bus_number = '662UD' AND s.stop_order = 4 THEN 'SATHUR BYPASS BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 5 THEN 'VIRUDHNAGAR BYPASS BS'
    WHEN b.bus_number = '662UD' AND s.stop_order = 6 THEN 'PALANI'
    WHEN b.bus_number = '150C' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '857A' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '857C' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '857B' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '138' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '150A' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '541D' AND s.stop_order = 0 THEN 'TIRUPPUR NEW BUSSTAND'
    WHEN b.bus_number = '620C' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '620B' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '620A' AND s.stop_order = 0 THEN 'TIRUPPUR KOVILVALI BS'
    WHEN b.bus_number = '787UD' AND s.stop_order = 0 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '787UD' AND s.stop_order = 1 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '787UD' AND s.stop_order = 2 THEN 'SRIPERUMBUDUR TOLL'
    WHEN b.bus_number = '787UD' AND s.stop_order = 6 THEN 'PALGHAT KSRTC B.S'
    WHEN b.bus_number = '787UD' AND s.stop_order = 7 THEN 'TRISSUR KSRTC B.S'
    WHEN b.bus_number = '460AB' AND s.stop_order = 0 THEN 'CHENNAI-PT Dr.M.G.R. BS'
    WHEN b.bus_number = '460AB' AND s.stop_order = 1 THEN 'POONMALEE BYPASS MTC DEPOT NR'
    WHEN b.bus_number = '460AB' AND s.stop_order = 2 THEN 'SRIPERUMBUDUR TOLL'
    WHEN b.bus_number = '460AB' AND s.stop_order = 6 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '962AUD' AND s.stop_order = 7 THEN 'GANDHIPURAM SETC BS'
    WHEN b.bus_number = '841AC' AND s.stop_order = 1 THEN 'VILLIYANUR BYPASS'
    WHEN b.bus_number = '841AC' AND s.stop_order = 2 THEN 'MANAKULA VINAYAGAR  COLLEGE'
    WHEN b.bus_number = '841AC' AND s.stop_order = 3 THEN 'VALAVANUR'
    WHEN b.bus_number = '841AC' AND s.stop_order = 5 THEN 'GANDHIPURAM SETC BS'
  END
SET s.name = l.name,
    s.location_id = l.id
WHERE (
  (b.bus_number = '303NS' AND s.stop_order = 3)
  OR   (b.bus_number = '303NS' AND s.stop_order = 4)
  OR   (b.bus_number = '303NS' AND s.stop_order = 5)
  OR   (b.bus_number = '303NS' AND s.stop_order = 6)
  OR   (b.bus_number = '303LB' AND s.stop_order = 0)
  OR   (b.bus_number = '303LB' AND s.stop_order = 1)
  OR   (b.bus_number = '303LB' AND s.stop_order = 2)
  OR   (b.bus_number = '303LB' AND s.stop_order = 3)
  OR   (b.bus_number = '303LB' AND s.stop_order = 4)
  OR   (b.bus_number = '303LB' AND s.stop_order = 5)
  OR   (b.bus_number = '303LB' AND s.stop_order = 6)
  OR   (b.bus_number = '303NS' AND s.stop_order = 0)
  OR   (b.bus_number = '303NS' AND s.stop_order = 1)
  OR   (b.bus_number = '303NS' AND s.stop_order = 2)
  OR   (b.bus_number = '303NS' AND s.stop_order = 3)
  OR   (b.bus_number = '303NS' AND s.stop_order = 4)
  OR   (b.bus_number = '303NS' AND s.stop_order = 5)
  OR   (b.bus_number = '303NS' AND s.stop_order = 6)
  OR   (b.bus_number = '303NS' AND s.stop_order = 7)
  OR   (b.bus_number = '303NS' AND s.stop_order = 8)
  OR   (b.bus_number = '205M' AND s.stop_order = 0)
  OR   (b.bus_number = '205G' AND s.stop_order = 0)
  OR   (b.bus_number = '205Z' AND s.stop_order = 0)
  OR   (b.bus_number = '224H' AND s.stop_order = 0)
  OR   (b.bus_number = '201B' AND s.stop_order = 0)
  OR   (b.bus_number = '303AC' AND s.stop_order = 0)
  OR   (b.bus_number = '303AC' AND s.stop_order = 1)
  OR   (b.bus_number = '303AC' AND s.stop_order = 2)
  OR   (b.bus_number = '303AC' AND s.stop_order = 3)
  OR   (b.bus_number = '303AC' AND s.stop_order = 4)
  OR   (b.bus_number = '303AC' AND s.stop_order = 5)
  OR   (b.bus_number = '303AC' AND s.stop_order = 6)
  OR   (b.bus_number = '303AC' AND s.stop_order = 7)
  OR   (b.bus_number = '303AC' AND s.stop_order = 8)
  OR   (b.bus_number = '205X' AND s.stop_order = 0)
  OR   (b.bus_number = '201M' AND s.stop_order = 0)
  OR   (b.bus_number = '201U' AND s.stop_order = 0)
  OR   (b.bus_number = '333UD' AND s.stop_order = 0)
  OR   (b.bus_number = '303LB' AND s.stop_order = 0)
  OR   (b.bus_number = '303LB' AND s.stop_order = 1)
  OR   (b.bus_number = '303LB' AND s.stop_order = 2)
  OR   (b.bus_number = '303LB' AND s.stop_order = 3)
  OR   (b.bus_number = '303LB' AND s.stop_order = 4)
  OR   (b.bus_number = '303LB' AND s.stop_order = 5)
  OR   (b.bus_number = '303LB' AND s.stop_order = 6)
  OR   (b.bus_number = '303AB' AND s.stop_order = 0)
  OR   (b.bus_number = '303AB' AND s.stop_order = 1)
  OR   (b.bus_number = '303AB' AND s.stop_order = 2)
  OR   (b.bus_number = '303AB' AND s.stop_order = 3)
  OR   (b.bus_number = '303AB' AND s.stop_order = 4)
  OR   (b.bus_number = '303AB' AND s.stop_order = 5)
  OR   (b.bus_number = '303AB' AND s.stop_order = 6)
  OR   (b.bus_number = '303AB' AND s.stop_order = 7)
  OR   (b.bus_number = '201E' AND s.stop_order = 0)
  OR   (b.bus_number = '303AB' AND s.stop_order = 0)
  OR   (b.bus_number = '303AB' AND s.stop_order = 1)
  OR   (b.bus_number = '303AB' AND s.stop_order = 2)
  OR   (b.bus_number = '303AB' AND s.stop_order = 3)
  OR   (b.bus_number = '303AB' AND s.stop_order = 4)
  OR   (b.bus_number = '303AB' AND s.stop_order = 5)
  OR   (b.bus_number = '303AB' AND s.stop_order = 6)
  OR   (b.bus_number = '303AB' AND s.stop_order = 7)
  OR   (b.bus_number = '303AB' AND s.stop_order = 8)
  OR   (b.bus_number = '501I' AND s.stop_order = 0)
  OR   (b.bus_number = '510F' AND s.stop_order = 0)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 0)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 1)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 2)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 3)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 4)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 5)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 6)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 7)
  OR   (b.bus_number = '162VUD' AND s.stop_order = 9)
  OR   (b.bus_number = '180AB' AND s.stop_order = 0)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 5)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 0)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 1)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 2)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 3)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 4)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 5)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 6)
  OR   (b.bus_number = '190MUD' AND s.stop_order = 7)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 1)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 2)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 3)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 4)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 5)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 6)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 7)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 8)
  OR   (b.bus_number = 'H287UD' AND s.stop_order = 9)
  OR   (b.bus_number = '180LB' AND s.stop_order = 0)
  OR   (b.bus_number = '180LB' AND s.stop_order = 1)
  OR   (b.bus_number = '180LB' AND s.stop_order = 2)
  OR   (b.bus_number = '180LB' AND s.stop_order = 3)
  OR   (b.bus_number = '180LB' AND s.stop_order = 4)
  OR   (b.bus_number = '180LB' AND s.stop_order = 5)
  OR   (b.bus_number = '180LB' AND s.stop_order = 6)
  OR   (b.bus_number = '180LB' AND s.stop_order = 7)
  OR   (b.bus_number = '180LB' AND s.stop_order = 8)
  OR   (b.bus_number = '180UD' AND s.stop_order = 0)
  OR   (b.bus_number = '180UD' AND s.stop_order = 1)
  OR   (b.bus_number = '180UD' AND s.stop_order = 2)
  OR   (b.bus_number = '180UD' AND s.stop_order = 3)
  OR   (b.bus_number = '180UD' AND s.stop_order = 4)
  OR   (b.bus_number = '180UD' AND s.stop_order = 5)
  OR   (b.bus_number = '180UD' AND s.stop_order = 6)
  OR   (b.bus_number = '180UD' AND s.stop_order = 7)
  OR   (b.bus_number = '180UD' AND s.stop_order = 8)
  OR   (b.bus_number = '194UD' AND s.stop_order = 0)
  OR   (b.bus_number = '194UD' AND s.stop_order = 1)
  OR   (b.bus_number = '194UD' AND s.stop_order = 2)
  OR   (b.bus_number = '194UD' AND s.stop_order = 3)
  OR   (b.bus_number = '194UD' AND s.stop_order = 4)
  OR   (b.bus_number = '194UD' AND s.stop_order = 5)
  OR   (b.bus_number = '194UD' AND s.stop_order = 6)
  OR   (b.bus_number = '194UD' AND s.stop_order = 7)
  OR   (b.bus_number = '194UD' AND s.stop_order = 8)
  OR   (b.bus_number = '180MS' AND s.stop_order = 0)
  OR   (b.bus_number = '180MS' AND s.stop_order = 1)
  OR   (b.bus_number = '180MS' AND s.stop_order = 2)
  OR   (b.bus_number = '180MS' AND s.stop_order = 3)
  OR   (b.bus_number = '180MS' AND s.stop_order = 4)
  OR   (b.bus_number = '180MS' AND s.stop_order = 5)
  OR   (b.bus_number = '180MS' AND s.stop_order = 6)
  OR   (b.bus_number = '180MS' AND s.stop_order = 7)
  OR   (b.bus_number = '180MS' AND s.stop_order = 8)
  OR   (b.bus_number = '180NS' AND s.stop_order = 0)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '180NS' AND s.stop_order = 7)
  OR   (b.bus_number = '180NS' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 0)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 5)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '180UD' AND s.stop_order = 0)
  OR   (b.bus_number = '180UD' AND s.stop_order = 1)
  OR   (b.bus_number = '180UD' AND s.stop_order = 2)
  OR   (b.bus_number = '180UD' AND s.stop_order = 3)
  OR   (b.bus_number = '180UD' AND s.stop_order = 4)
  OR   (b.bus_number = '180UD' AND s.stop_order = 5)
  OR   (b.bus_number = '180UD' AND s.stop_order = 6)
  OR   (b.bus_number = '180UD' AND s.stop_order = 7)
  OR   (b.bus_number = '180UD' AND s.stop_order = 8)
  OR   (b.bus_number = '180NS' AND s.stop_order = 0)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '180NS' AND s.stop_order = 7)
  OR   (b.bus_number = '180NS' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 0)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 5)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '180AB' AND s.stop_order = 8)
  OR   (b.bus_number = '180NS' AND s.stop_order = 0)
  OR   (b.bus_number = '180NS' AND s.stop_order = 1)
  OR   (b.bus_number = '180NS' AND s.stop_order = 2)
  OR   (b.bus_number = '180NS' AND s.stop_order = 3)
  OR   (b.bus_number = '180NS' AND s.stop_order = 4)
  OR   (b.bus_number = '180NS' AND s.stop_order = 5)
  OR   (b.bus_number = '180NS' AND s.stop_order = 6)
  OR   (b.bus_number = '180NS' AND s.stop_order = 7)
  OR   (b.bus_number = '180NS' AND s.stop_order = 8)
  OR   (b.bus_number = '180AS' AND s.stop_order = 0)
  OR   (b.bus_number = '180AS' AND s.stop_order = 1)
  OR   (b.bus_number = '180AS' AND s.stop_order = 2)
  OR   (b.bus_number = '180AS' AND s.stop_order = 3)
  OR   (b.bus_number = '180AS' AND s.stop_order = 4)
  OR   (b.bus_number = '180AS' AND s.stop_order = 5)
  OR   (b.bus_number = '180AS' AND s.stop_order = 6)
  OR   (b.bus_number = '180AS' AND s.stop_order = 7)
  OR   (b.bus_number = '180AS' AND s.stop_order = 8)
  OR   (b.bus_number = '180AB' AND s.stop_order = 0)
  OR   (b.bus_number = '180AB' AND s.stop_order = 1)
  OR   (b.bus_number = '180AB' AND s.stop_order = 2)
  OR   (b.bus_number = '180AB' AND s.stop_order = 3)
  OR   (b.bus_number = '180AB' AND s.stop_order = 4)
  OR   (b.bus_number = '180AB' AND s.stop_order = 5)
  OR   (b.bus_number = '180AB' AND s.stop_order = 6)
  OR   (b.bus_number = '180AB' AND s.stop_order = 7)
  OR   (b.bus_number = '136G' AND s.stop_order = 0)
  OR   (b.bus_number = '136B' AND s.stop_order = 0)
  OR   (b.bus_number = '136E' AND s.stop_order = 0)
  OR   (b.bus_number = '136H' AND s.stop_order = 0)
  OR   (b.bus_number = '136B' AND s.stop_order = 0)
  OR   (b.bus_number = '136B' AND s.stop_order = 0)
  OR   (b.bus_number = '829A' AND s.stop_order = 0)
  OR   (b.bus_number = '136K' AND s.stop_order = 0)
  OR   (b.bus_number = '536A' AND s.stop_order = 0)
  OR   (b.bus_number = '852A' AND s.stop_order = 0)
  OR   (b.bus_number = '346' AND s.stop_order = 0)
  OR   (b.bus_number = '601B' AND s.stop_order = 0)
  OR   (b.bus_number = '874A' AND s.stop_order = 0)
  OR   (b.bus_number = '601A' AND s.stop_order = 0)
  OR   (b.bus_number = '662UD' AND s.stop_order = 1)
  OR   (b.bus_number = '662UD' AND s.stop_order = 2)
  OR   (b.bus_number = '662UD' AND s.stop_order = 3)
  OR   (b.bus_number = '662UD' AND s.stop_order = 5)
  OR   (b.bus_number = '874B' AND s.stop_order = 0)
  OR   (b.bus_number = 'SPL' AND s.stop_order = 1)
  OR   (b.bus_number = '995A' AND s.stop_order = 0)
  OR   (b.bus_number = '664EUD' AND s.stop_order = 1)
  OR   (b.bus_number = '664EUD' AND s.stop_order = 5)
  OR   (b.bus_number = '664KUD' AND s.stop_order = 4)
  OR   (b.bus_number = '664KUD' AND s.stop_order = 5)
  OR   (b.bus_number = '663UD' AND s.stop_order = 2)
  OR   (b.bus_number = '663UD' AND s.stop_order = 4)
  OR   (b.bus_number = '663UD' AND s.stop_order = 6)
  OR   (b.bus_number = '874HUD' AND s.stop_order = 4)
  OR   (b.bus_number = '783UD' AND s.stop_order = 4)
  OR   (b.bus_number = '783UD' AND s.stop_order = 5)
  OR   (b.bus_number = '783UD' AND s.stop_order = 7)
  OR   (b.bus_number = '664MUD' AND s.stop_order = 1)
  OR   (b.bus_number = '664MUD' AND s.stop_order = 5)
  OR   (b.bus_number = '664UD' AND s.stop_order = 0)
  OR   (b.bus_number = '664UD' AND s.stop_order = 1)
  OR   (b.bus_number = '664UD' AND s.stop_order = 2)
  OR   (b.bus_number = '664UD' AND s.stop_order = 3)
  OR   (b.bus_number = '664AVUD' AND s.stop_order = 1)
  OR   (b.bus_number = '835B' AND s.stop_order = 1)
  OR   (b.bus_number = '569C' AND s.stop_order = 1)
  OR   (b.bus_number = '187' AND s.stop_order = 1)
  OR   (b.bus_number = '497' AND s.stop_order = 1)
  OR   (b.bus_number = '835A' AND s.stop_order = 1)
  OR   (b.bus_number = '835C' AND s.stop_order = 1)
  OR   (b.bus_number = '835D' AND s.stop_order = 1)
  OR   (b.bus_number = '874PUD' AND s.stop_order = 0)
  OR   (b.bus_number = '874PUD' AND s.stop_order = 1)
  OR   (b.bus_number = '874PUD' AND s.stop_order = 2)
  OR   (b.bus_number = '873UD' AND s.stop_order = 0)
  OR   (b.bus_number = '873UD' AND s.stop_order = 1)
  OR   (b.bus_number = '873UD' AND s.stop_order = 2)
  OR   (b.bus_number = '873UD' AND s.stop_order = 3)
  OR   (b.bus_number = '870NS' AND s.stop_order = 0)
  OR   (b.bus_number = '870NS' AND s.stop_order = 1)
  OR   (b.bus_number = '870NS' AND s.stop_order = 2)
  OR   (b.bus_number = '870NS' AND s.stop_order = 3)
  OR   (b.bus_number = '870NS' AND s.stop_order = 6)
  OR   (b.bus_number = '874B' AND s.stop_order = 1)
  OR   (b.bus_number = '666UD' AND s.stop_order = 1)
  OR   (b.bus_number = '666UD' AND s.stop_order = 3)
  OR   (b.bus_number = '666UD' AND s.stop_order = 4)
  OR   (b.bus_number = '666UD' AND s.stop_order = 5)
  OR   (b.bus_number = '666UD' AND s.stop_order = 6)
  OR   (b.bus_number = '666UD' AND s.stop_order = 7)
  OR   (b.bus_number = '666UD' AND s.stop_order = 8)
  OR   (b.bus_number = '666UD' AND s.stop_order = 9)
  OR   (b.bus_number = '874A' AND s.stop_order = 1)
  OR   (b.bus_number = '662UD' AND s.stop_order = 3)
  OR   (b.bus_number = '662UD' AND s.stop_order = 4)
  OR   (b.bus_number = '662UD' AND s.stop_order = 5)
  OR   (b.bus_number = '662UD' AND s.stop_order = 6)
  OR   (b.bus_number = '150C' AND s.stop_order = 0)
  OR   (b.bus_number = '857A' AND s.stop_order = 0)
  OR   (b.bus_number = '857C' AND s.stop_order = 0)
  OR   (b.bus_number = '857B' AND s.stop_order = 0)
  OR   (b.bus_number = '138' AND s.stop_order = 0)
  OR   (b.bus_number = '150A' AND s.stop_order = 0)
  OR   (b.bus_number = '541D' AND s.stop_order = 0)
  OR   (b.bus_number = '620C' AND s.stop_order = 0)
  OR   (b.bus_number = '620B' AND s.stop_order = 0)
  OR   (b.bus_number = '620A' AND s.stop_order = 0)
  OR   (b.bus_number = '787UD' AND s.stop_order = 0)
  OR   (b.bus_number = '787UD' AND s.stop_order = 1)
  OR   (b.bus_number = '787UD' AND s.stop_order = 2)
  OR   (b.bus_number = '787UD' AND s.stop_order = 6)
  OR   (b.bus_number = '787UD' AND s.stop_order = 7)
  OR   (b.bus_number = '460AB' AND s.stop_order = 0)
  OR   (b.bus_number = '460AB' AND s.stop_order = 1)
  OR   (b.bus_number = '460AB' AND s.stop_order = 2)
  OR   (b.bus_number = '460AB' AND s.stop_order = 6)
  OR   (b.bus_number = '962AUD' AND s.stop_order = 7)
  OR   (b.bus_number = '841AC' AND s.stop_order = 1)
  OR   (b.bus_number = '841AC' AND s.stop_order = 2)
  OR   (b.bus_number = '841AC' AND s.stop_order = 3)
  OR   (b.bus_number = '841AC' AND s.stop_order = 5)
);

COMMIT;

-- ============================================================
-- Verify: bus 284KUD should now show distinct stop names
-- ============================================================
SELECT b.bus_number, s.stop_order, s.name, s.arrival_time
FROM stops s
JOIN buses b ON s.bus_id = b.id
WHERE b.bus_number = '284KUD'
ORDER BY s.stop_order;