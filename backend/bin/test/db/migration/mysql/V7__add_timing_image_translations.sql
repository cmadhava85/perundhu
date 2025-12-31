-- Add translations for timing image contribution features
-- This migration adds Tamil translations for:
-- 1. Enum values (BoardType, TimingImageStatus, SkipReason, TimingType, TimingSource)
-- 2. UI labels for the timing image upload feature
-- 3. Admin panel labels
-- 4. Error messages and validation messages

-- ================================================
-- ENUM TRANSLATIONS
-- ================================================

-- BoardType Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 1, 'ta', 'BoardType.GOVERNMENT', 'அரசு'),
('enum', 2, 'ta', 'BoardType.PRIVATE', 'தனியார்'),
('enum', 3, 'ta', 'BoardType.LOCAL', 'உள்ளூர்'),
('enum', 4, 'ta', 'BoardType.INTER_CITY', 'நகரங்களுக்கு இடையில்');

-- TimingImageStatus Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 5, 'ta', 'TimingImageStatus.PENDING', 'நிலுவையில்'),
('enum', 6, 'ta', 'TimingImageStatus.APPROVED', 'அங்கீகரிக்கப்பட்டது'),
('enum', 7, 'ta', 'TimingImageStatus.REJECTED', 'நிராகரிக்கப்பட்டது'),
('enum', 8, 'ta', 'TimingImageStatus.PROCESSING', 'செயலாக்கப்படுகிறது');

-- DuplicateCheckStatus Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 9, 'ta', 'DuplicateCheckStatus.CHECKED', 'சரிபார்க்கப்பட்டது'),
('enum', 10, 'ta', 'DuplicateCheckStatus.DUPLICATES_FOUND', 'நகல்கள் கண்டுபிடிக்கப்பட்டது'),
('enum', 11, 'ta', 'DuplicateCheckStatus.UNIQUE', 'தனித்துவமானது'),
('enum', 12, 'ta', 'DuplicateCheckStatus.SKIPPED', 'தவிர்க்கப்பட்டது');

-- SkipReason Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 13, 'ta', 'SkipReason.DUPLICATE_EXACT', 'சரியான நகல்'),
('enum', 14, 'ta', 'SkipReason.DUPLICATE_SIMILAR', 'ஒத்த நகல்'),
('enum', 15, 'ta', 'SkipReason.INVALID_TIME', 'தவறான நேரம்'),
('enum', 16, 'ta', 'SkipReason.INVALID_LOCATION', 'தவறான இடம்');

-- TimingType Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 17, 'ta', 'TimingType.MORNING', 'காலை'),
('enum', 18, 'ta', 'TimingType.AFTERNOON', 'மாலை'),
('enum', 19, 'ta', 'TimingType.NIGHT', 'இரவு');

-- TimingSource Enum Translations
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('enum', 20, 'ta', 'TimingSource.USER_CONTRIBUTION', 'பயனர் பங்களிப்பு'),
('enum', 21, 'ta', 'TimingSource.OFFICIAL', 'அதிகாரப்பூர்வ'),
('enum', 22, 'ta', 'TimingSource.OCR_EXTRACTED', 'OCR பிரித்தெடுக்கப்பட்டது');

-- ================================================
-- UI LABEL TRANSLATIONS
-- ================================================

-- Bus Timing Upload UI Labels
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('ui_label', 100, 'ta', 'busTimings.upload.title', 'பேருந்து நேர அட்டவணை பதிவேற்றம்'),
('ui_label', 101, 'ta', 'busTimings.upload.description', 'பிற பயணிகளுக்கு உதவ பேருந்து நிலையங்களிலிருந்து பேருந்து நேர அட்டவணைகளைப் பகிரவும்'),
('ui_label', 102, 'ta', 'busTimings.upload.tip', 'குறிப்பு: அதிகாரப்பூர்வ பேருந்து நேர அட்டவணைகளின் தெளிவான புகைப்படங்கள் சிறந்தவை'),
('ui_label', 103, 'ta', 'busTimings.upload.image', 'பேருந்து நேர அட்டவணை படம்'),
('ui_label', 104, 'ta', 'busTimings.upload.origin', 'தொடக்க இடம் (ஆங்கிலம்)'),
('ui_label', 105, 'ta', 'busTimings.upload.originTamil', 'தொடக்க இடம் (தமிழ்)'),
('ui_label', 106, 'ta', 'busTimings.upload.description', 'கூடுதல் குறிப்புகள்'),
('ui_label', 107, 'ta', 'busTimings.upload.submit', 'பங்களிப்பைச் சமர்ப்பிக்கவும்'),
('ui_label', 108, 'ta', 'busTimings.upload.uploading', 'பதிவேற்றுகிறது...'),
('ui_label', 109, 'ta', 'busTimings.upload.reset', 'மீட்டமைக்கவும்'),
('ui_label', 110, 'ta', 'busTimings.upload.success', 'பதிவேற்றம் வெற்றிகரமாக! உங்கள் பங்களிப்பு மதிப்பாய்வு நிலுவையில் உள்ளது'),
('ui_label', 111, 'ta', 'busTimings.upload.boardType', 'பேருந்து வகை'),
('ui_label', 112, 'ta', 'busTimings.upload.selectBoardType', 'பேருந்து வகையைத் தேர்ந்தெடுக்கவும்'),
('ui_label', 113, 'ta', 'busTimings.upload.imagePreview', 'படம் முன்காட்சி'),
('ui_label', 114, 'ta', 'busTimings.upload.removeImage', 'படத்தை அகற்று'),
('ui_label', 115, 'ta', 'busTimings.upload.dragDrop', 'கிளிக் செய்து பதிவேற்றவும் அல்லது இழுத்து விடவும்'),
('ui_label', 116, 'ta', 'busTimings.upload.fileSize', 'PNG, JPG 10MB வரை');

-- Admin Panel UI Labels
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('ui_label', 200, 'ta', 'admin.timingImages.title', 'நேர அட்டவணை படம் மேலாண்மை'),
('ui_label', 201, 'ta', 'admin.timingImages.subtitle', 'பயனர் சமர்ப்பித்த நேர அட்டவணை படங்களை மதிப்பாய்வு செய்து அங்கீகரிக்கவும்'),
('ui_label', 202, 'ta', 'admin.timingImages.pending', 'நிலுவையில் உள்ள மதிப்பாய்வு'),
('ui_label', 203, 'ta', 'admin.timingImages.approve', 'அங்கீகரி'),
('ui_label', 204, 'ta', 'admin.timingImages.reject', 'நிராகரி'),
('ui_label', 205, 'ta', 'admin.timingImages.delete', 'நீக்கு'),
('ui_label', 206, 'ta', 'admin.timingImages.view', 'பார்வையிடு'),
('ui_label', 207, 'ta', 'admin.timingImages.extractedData', 'பிரித்தெடுக்கப்பட்ட தரவு'),
('ui_label', 208, 'ta', 'admin.timingImages.ocrConfidence', 'OCR நம்பகத்தன்மை'),
('ui_label', 209, 'ta', 'admin.timingImages.submittedBy', 'சமர்ப்பித்தவர்'),
('ui_label', 210, 'ta', 'admin.timingImages.submissionDate', 'சமர்ப்பித்த தேதி'),
('ui_label', 211, 'ta', 'admin.timingImages.reviewStatus', 'மதிப்பாய்வு நிலை'),
('ui_label', 212, 'ta', 'admin.timingImages.manualReview', 'கைமுறை மதிப்பாய்வு தேவை'),
('ui_label', 213, 'ta', 'admin.timingImages.noContributions', 'பங்களிப்புகள் எதுவும் இல்லை'),
('ui_label', 214, 'ta', 'admin.timingImages.loading', 'பங்களிப்புகளை ஏற்றுகிறது...'),
('ui_label', 215, 'ta', 'admin.timingImages.filterStatus', 'நிலையின் அடிப்படையில் வடிகட்டு'),
('ui_label', 216, 'ta', 'admin.timingImages.searchPlaceholder', 'பங்களிப்புகளைத் தேடு...');

-- Bus Timing Records UI Labels
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('ui_label', 300, 'ta', 'busTimings.records.title', 'பேருந்து நேர பதிவுகள்'),
('ui_label', 301, 'ta', 'busTimings.records.morning', 'காலை நேரங்கள்'),
('ui_label', 302, 'ta', 'busTimings.records.afternoon', 'மதிய நேரங்கள்'),
('ui_label', 303, 'ta', 'busTimings.records.night', 'இரவு நேரங்கள்'),
('ui_label', 304, 'ta', 'busTimings.records.verified', 'சரிபார்க்கப்பட்டது'),
('ui_label', 305, 'ta', 'busTimings.records.unverified', 'சரிபார்க்கப்படவில்லை'),
('ui_label', 306, 'ta', 'busTimings.records.source', 'மூலம்'),
('ui_label', 307, 'ta', 'busTimings.records.lastUpdated', 'கடைசியாக புதுப்பிக்கப்பட்டது'),
('ui_label', 308, 'ta', 'busTimings.records.departureTime', 'புறப்படும் நேரம்'),
('ui_label', 309, 'ta', 'busTimings.records.arrivalTime', 'வருகை நேரம்'),
('ui_label', 310, 'ta', 'busTimings.records.noTimings', 'இந்த வழித்தடத்திற்கு நேரங்கள் கிடைக்கவில்லை');

-- ================================================
-- ERROR AND VALIDATION MESSAGES
-- ================================================

-- Upload Validation Errors
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('error_message', 400, 'ta', 'error.upload.fileRequired', 'தயவுசெய்து ஒரு படத்தைத் தேர்ந்தெடுக்கவும்'),
('error_message', 401, 'ta', 'error.upload.fileTooLarge', 'படம் மிகப் பெரியது (அதிகபட்சம் 10MB)'),
('error_message', 402, 'ta', 'error.upload.invalidFileType', 'தயவுசெய்து ஒரு படக் கோப்பைத் தேர்ந்தெடுக்கவும் (JPG, PNG, போன்றவை)'),
('error_message', 403, 'ta', 'error.upload.originRequired', 'தயவுசெய்து தொடக்க இடத்தை உள்ளிடவும்'),
('error_message', 404, 'ta', 'error.upload.uploadFailed', 'பதிவேற்றம் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்'),
('error_message', 405, 'ta', 'error.upload.networkError', 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்'),
('error_message', 406, 'ta', 'error.upload.serverError', 'சேவையக பிழை. பின்னர் முயற்சிக்கவும்');

-- OCR Processing Errors
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('error_message', 500, 'ta', 'error.ocr.processingFailed', 'OCR செயலாக்கம் தோல்வியடைந்தது'),
('error_message', 501, 'ta', 'error.ocr.noTextDetected', 'படத்தில் உரை கண்டறியப்படவில்லை'),
('error_message', 502, 'ta', 'error.ocr.lowConfidence', 'குறைந்த OCR நம்பிக்கை - கைமுறை மதிப்பாய்வு தேவை'),
('error_message', 503, 'ta', 'error.ocr.invalidFormat', 'படம் செயலாக்க முடியாத வடிவத்தில் உள்ளது'),
('error_message', 504, 'ta', 'error.ocr.timeout', 'OCR செயலாக்கம் காலாவதியானது');

-- Duplicate Check Messages
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('info_message', 600, 'ta', 'info.duplicate.exactMatch', 'இந்த நேரம் ஏற்கனவே உள்ளது'),
('info_message', 601, 'ta', 'info.duplicate.similarMatch', 'ஒத்த நேரம் கண்டறியப்பட்டது'),
('info_message', 602, 'ta', 'info.duplicate.skipped', 'நகல் காரணமாக தவிர்க்கப்பட்டது'),
('info_message', 603, 'ta', 'info.duplicate.unique', 'தனித்துவமான நேரம் - அங்கீகரிக்கப்பட்டது');

-- Success Messages
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('success_message', 700, 'ta', 'success.contribution.submitted', 'உங்கள் பங்களிப்பு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது'),
('success_message', 701, 'ta', 'success.contribution.approved', 'பங்களிப்பு அங்கீகரிக்கப்பட்டது'),
('success_message', 702, 'ta', 'success.contribution.rejected', 'பங்களிப்பு நிராகரிக்கப்பட்டது'),
('success_message', 703, 'ta', 'success.contribution.deleted', 'பங்களிப்பு நீக்கப்பட்டது'),
('success_message', 704, 'ta', 'success.ocr.completed', 'OCR செயலாக்கம் முடிந்தது'),
('success_message', 705, 'ta', 'success.timings.extracted', 'நேரங்கள் வெற்றிகரமாக பிரித்தெடுக்கப்பட்டன');

-- ================================================
-- INFORMATIONAL MESSAGES
-- ================================================

-- General Info Messages
INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES
('info_message', 800, 'ta', 'info.upload.processing', 'உங்கள் படம் செயலாக்கப்படுகிறது...'),
('info_message', 801, 'ta', 'info.upload.pendingReview', 'நிலுவையில் உள்ள மதிப்பாய்வு - ஒரு நிர்வாகி விரைவில் இதைச் சரிபார்ப்பார்'),
('info_message', 802, 'ta', 'info.upload.manualReviewRequired', 'கைமுறை மதிப்பாய்வு தேவை'),
('info_message', 803, 'ta', 'info.contribution.thankyou', 'சமூகத்திற்கு பங்களித்ததற்கு நன்றி!'),
('info_message', 804, 'ta', 'info.timings.estimatedOnly', 'இவை மதிப்பிடப்பட்ட நேரங்கள் மட்டுமே'),
('info_message', 805, 'ta', 'info.timings.officialSource', 'அதிகாரப்பூர்வ மூலத்திலிருந்து சரிபார்க்கப்பட்டது');
