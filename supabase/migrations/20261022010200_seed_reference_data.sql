-- Seed data: a documented SUBSET of real institutions and their real
-- official domains (not the full UK sponsor register / Canada DLI list /
-- US SEVP list -- see AI_DISCLOSURE.md). An institution outside this subset
-- returns "not_found", never a false "checks_passed".

insert into registry_snapshots (id, country, source, snapshot_date) values
  ('11111111-1111-1111-1111-111111111111', 'GB', 'UK Register of Sponsors (seeded subset)', '2026-10-01'),
  ('22222222-2222-2222-2222-222222222222', 'CA', 'Canada Designated Learning Institutions (seeded subset)', '2026-10-01'),
  ('33333333-3333-3333-3333-333333333333', 'US', 'US SEVP Certified Schools (seeded subset)', '2026-10-01')
on conflict (id) do nothing;

-- UK (15)
insert into institutions (name, country, registry_id, registry_status, snapshot_id) values
  ('University of Oxford', 'GB', 'UKSR-OXF', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Cambridge', 'GB', 'UKSR-CAM', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('Imperial College London', 'GB', 'UKSR-ICL', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University College London', 'GB', 'UKSR-UCL', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Edinburgh', 'GB', 'UKSR-EDI', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Manchester', 'GB', 'UKSR-MAN', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('King''s College London', 'GB', 'UKSR-KCL', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Bristol', 'GB', 'UKSR-BRI', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Leeds', 'GB', 'UKSR-LEE', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Glasgow', 'GB', 'UKSR-GLA', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Birmingham', 'GB', 'UKSR-BHM', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Sheffield', 'GB', 'UKSR-SHF', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('University of Southampton', 'GB', 'UKSR-SOU', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('Queen Mary University of London', 'GB', 'UKSR-QMU', 'listed', '11111111-1111-1111-1111-111111111111'),
  ('Lancaster University', 'GB', 'UKSR-LAN', 'listed', '11111111-1111-1111-1111-111111111111');

-- Canada (10)
insert into institutions (name, country, registry_id, registry_status, snapshot_id) values
  ('University of Toronto', 'CA', 'DLI-TOR', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('University of British Columbia', 'CA', 'DLI-UBC', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('McGill University', 'CA', 'DLI-MCG', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('University of Waterloo', 'CA', 'DLI-WAT', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('University of Alberta', 'CA', 'DLI-ALB', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('McMaster University', 'CA', 'DLI-MCM', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('Western University', 'CA', 'DLI-WES', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('University of Ottawa', 'CA', 'DLI-OTT', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('Queen''s University', 'CA', 'DLI-QUE', 'listed', '22222222-2222-2222-2222-222222222222'),
  ('Simon Fraser University', 'CA', 'DLI-SFU', 'listed', '22222222-2222-2222-2222-222222222222');

-- US (10)
insert into institutions (name, country, registry_id, registry_status, snapshot_id) values
  ('Harvard University', 'US', 'SEVP-HAR', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('Massachusetts Institute of Technology', 'US', 'SEVP-MIT', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('Stanford University', 'US', 'SEVP-STA', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('University of California, Berkeley', 'US', 'SEVP-UCB', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('Columbia University', 'US', 'SEVP-COL', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('University of Michigan', 'US', 'SEVP-UMI', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('New York University', 'US', 'SEVP-NYU', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('University of Texas at Austin', 'US', 'SEVP-UTA', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('Purdue University', 'US', 'SEVP-PUR', 'certified', '33333333-3333-3333-3333-333333333333'),
  ('Arizona State University', 'US', 'SEVP-ASU', 'certified', '33333333-3333-3333-3333-333333333333');

-- Official domains, mapped by institution name.
insert into institution_domains (institution_id, domain)
select id, d.domain from institutions i
join (values
  ('University of Oxford', 'ox.ac.uk'),
  ('University of Cambridge', 'cam.ac.uk'),
  ('Imperial College London', 'imperial.ac.uk'),
  ('University College London', 'ucl.ac.uk'),
  ('University of Edinburgh', 'ed.ac.uk'),
  ('University of Manchester', 'manchester.ac.uk'),
  ('King''s College London', 'kcl.ac.uk'),
  ('University of Bristol', 'bristol.ac.uk'),
  ('University of Leeds', 'leeds.ac.uk'),
  ('University of Glasgow', 'gla.ac.uk'),
  ('University of Birmingham', 'birmingham.ac.uk'),
  ('University of Sheffield', 'sheffield.ac.uk'),
  ('University of Southampton', 'southampton.ac.uk'),
  ('Queen Mary University of London', 'qmul.ac.uk'),
  ('Lancaster University', 'lancaster.ac.uk'),
  ('University of Toronto', 'utoronto.ca'),
  ('University of British Columbia', 'ubc.ca'),
  ('McGill University', 'mcgill.ca'),
  ('University of Waterloo', 'uwaterloo.ca'),
  ('University of Alberta', 'ualberta.ca'),
  ('McMaster University', 'mcmaster.ca'),
  ('Western University', 'uwo.ca'),
  ('University of Ottawa', 'uottawa.ca'),
  ('Queen''s University', 'queensu.ca'),
  ('Simon Fraser University', 'sfu.ca'),
  ('Harvard University', 'harvard.edu'),
  ('Massachusetts Institute of Technology', 'mit.edu'),
  ('Stanford University', 'stanford.edu'),
  ('University of California, Berkeley', 'berkeley.edu'),
  ('Columbia University', 'columbia.edu'),
  ('University of Michigan', 'umich.edu'),
  ('New York University', 'nyu.edu'),
  ('University of Texas at Austin', 'utexas.edu'),
  ('Purdue University', 'purdue.edu'),
  ('Arizona State University', 'asu.edu')
) as d(name, domain) on d.name = i.name;

insert into red_flag_catalogue (code, severity, title_en, title_ur, explanation_en, explanation_ur) values
  ('GUARANTEED_VISA', 'high', 'Guaranteed visa claim', 'ویزا کی ضمانت کا دعویٰ', 'The document claims a visa is guaranteed, which no genuine offer can promise.', 'دستاویز میں ویزا کی ضمانت کا دعویٰ کیا گیا ہے، جو کوئی حقیقی آفر نہیں دے سکتی۔'),
  ('GUARANTEED_ADMISSION_OR_SCHOLARSHIP', 'high', 'Guaranteed admission or scholarship claim', 'داخلے یا سکالرشپ کی ضمانت کا دعویٰ', 'The document claims guaranteed admission or a scholarship, which real institutions do not promise in writing before formal review.', 'دستاویز میں داخلے یا سکالرشپ کی ضمانت کا دعویٰ کیا گیا ہے۔'),
  ('SCHOLARSHIP_REQUIRES_FEE', 'high', 'Scholarship requires an upfront fee', 'سکالرشپ کے لیے پیشگی فیس کا مطالبہ', 'The document asks for a fee before a scholarship is granted, which is not how genuine scholarships work.', 'دستاویز میں سکالرشپ سے پہلے فیس کا مطالبہ کیا گیا ہے۔'),
  ('PERSONAL_OR_WALLET_PAYMENT', 'high', 'Payment to a personal account or wallet', 'ذاتی اکاؤنٹ یا والیٹ میں ادائیگی', 'The document asks for payment to a personal account or mobile wallet rather than the institution''s own bank account.', 'دستاویز میں ذاتی اکاؤنٹ یا موبائل والیٹ میں ادائیگی کا مطالبہ کیا گیا ہے۔'),
  ('CASH_PAYMENT', 'high', 'Cash payment requested', 'نقد ادائیگی کا مطالبہ', 'The document asks for a cash payment instead of a traceable bank transfer.', 'دستاویز میں نقد ادائیگی کا مطالبہ کیا گیا ہے۔'),
  ('INSIDER_CONNECTION_CLAIM', 'medium', 'Claim of an insider connection', 'اندرونی رابطے کا دعویٰ', 'The document claims a special insider connection at the institution.', 'دستاویز میں ادارے کے اندر خاص رابطے کا دعویٰ کیا گیا ہے۔'),
  ('OFFICIAL_IMPERSONATION_CLAIM', 'medium', 'Claim of official status', 'سرکاری حیثیت کا دعویٰ', 'The document claims an official status or authority it has not demonstrated.', 'دستاویز میں سرکاری حیثیت کا دعویٰ کیا گیا ہے۔'),
  ('EXTREME_URGENCY', 'medium', 'Extreme urgency pressure', 'غیر معمولی جلدی کا دباؤ', 'The document creates unusual time pressure to act immediately.', 'دستاویز میں فوری کارروائی کے لیے غیر معمولی دباؤ ڈالا گیا ہے۔'),
  ('SECRECY_REQUEST', 'medium', 'Request for secrecy', 'راز رکھنے کی درخواست', 'The document asks the reader to keep the offer secret or not verify it independently.', 'دستاویز میں آفر کو راز رکھنے یا خود تصدیق نہ کرنے کی درخواست کی گئی ہے۔'),
  ('FREE_EMAIL_SENDER', 'high', 'Sent from a free email address', 'فری ای میل ایڈریس سے بھیجا گیا', 'The document was sent from a free email provider, not the institution''s own domain.', 'دستاویز ایک فری ای میل سروس سے بھیجی گئی ہے، ادارے کے اپنے ڈومین سے نہیں۔'),
  ('LOOKALIKE_DOMAIN', 'high', 'Look-alike domain', 'مشابہ ڈومین', 'The sender''s domain closely resembles the institution''s official domain but is not it.', 'بھیجنے والے کا ڈومین ادارے کے اصل ڈومین سے مشابہت رکھتا ہے مگر وہ نہیں ہے۔'),
  ('AMOUNT_MISMATCH', 'medium', 'Amount mismatch between documents', 'دستاویزات میں رقم میں فرق', 'The amount stated in one document does not match another document in the same case.', 'ایک دستاویز میں بتائی گئی رقم دوسری دستاویز سے میل نہیں کھاتی۔'),
  ('NAME_MISMATCH', 'medium', 'Name mismatch between documents', 'دستاویزات میں نام میں فرق', 'The name stated in one document does not match another document in the same case.', 'ایک دستاویز میں بتایا گیا نام دوسری دستاویز سے میل نہیں کھاتا۔'),
  ('DATE_INCONSISTENCY', 'medium', 'Inconsistent or implausible dates', 'تاریخوں میں عدم مطابقت', 'A date in the document is inconsistent (e.g. a deadline before the issue date) or has already passed.', 'دستاویز میں تاریخ غیر مطابقت رکھتی ہے یا گزر چکی ہے۔');
