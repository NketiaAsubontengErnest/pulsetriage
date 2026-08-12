$base = "http://localhost:3000/api"
function Show($name, $block) {
  try {
    $r = & $block
    Write-Host "PASS  $name"
    return $r
  } catch {
    Write-Host "FAIL  $name -> $($_.Exception.Message)"
    return $null
  }
}

# --- Auth ---
$login = Show "POST /auth/login (patient)" { Invoke-RestMethod "$base/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"patient@ug.edu.gh","password":"password123"}' }
Write-Output "      user: $($login.user.full_name) / $($login.user.role) / id=$($login.user.id)"

Show "POST /auth/login (bad password rejected)" {
  try { Invoke-RestMethod "$base/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"patient@ug.edu.gh","password":"wrong"}'; throw "accepted bad password" }
  catch { if ($_.Exception.Response.StatusCode.value__ -eq 401) { "401 as expected" } else { throw } }
} | Out-Null

# --- Reads ---
$docs  = Show "GET  /doctors"         { Invoke-RestMethod "$base/doctors" }
$pats  = Show "GET  /patients"        { Invoke-RestMethod "$base/patients" }
$specs = Show "GET  /specializations" { Invoke-RestMethod "$base/specializations" }
$audit = Show "GET  /audit"           { Invoke-RestMethod "$base/audit?limit=5" }
$notif = Show "GET  /notifications?all=true" { Invoke-RestMethod "$base/notifications?all=true" }
$pays  = Show "GET  /payments"        { Invoke-RestMethod "$base/payments" }
Write-Output "      doctors=$($docs.doctors.Count) patients=$($pats.patients.Count) specs=$($specs.specializations.Count) audit=$($audit.logs.Count) notifs=$($notif.notifications.Count) payments=$($pays.payments.Count)"

$pid_ = $login.user.id
$doc  = $docs.doctors[0]

# --- Triage write ---
$triageBody = @{
  patient_id = $pid_; primary_symptom = "SMOKE TEST Headache"; symptom_duration = "1-2 days"
  pain_score = 6; red_flag_present = $false; red_flags = @(); severity_score = 55
  urgency_level = "SEMI_URGENT"; recommended_specialty = $doc.specialization
  triage_summary = "smoke test"; action_recommendation = "smoke test action"
} | ConvertTo-Json
$triage = Show "POST /triage" { Invoke-RestMethod "$base/triage" -Method Post -ContentType "application/json" -Body $triageBody }
Write-Output "      triage id=$($triage.triage.id)"

Show "GET  /triage?patient_id" { Invoke-RestMethod "$base/triage?patient_id=$pid_" } | ForEach-Object { Write-Output "      triage records=$($_.triages.Count)" }

# --- Appointment write (doctor notification FK path) ---
$apptBody = @{
  patient_id = $pid_; doctor_id = $doc.id; triage_id = $triage.triage.id
  appointment_date = "2026-09-01"; start_time = "10:00"; end_time = "10:30"
  payment_amount = $doc.consultation_fee; reason = "SMOKE TEST booking"
} | ConvertTo-Json
$appt = Show "POST /appointments" { Invoke-RestMethod "$base/appointments" -Method Post -ContentType "application/json" -Body $apptBody }
Write-Output "      appt id=$($appt.appointment.id) status=$($appt.appointment.status) pay=$($appt.appointment.payment_status)"

# --- Payment write (flips to CONFIRMED) ---
$payBody = @{
  appointment_id = $appt.appointment.id; patient_id = $pid_; amount = $doc.consultation_fee
  payment_method = "MOBILE_MONEY"; provider = "MTN Mobile Money"; transaction_ref = "SMOKE-$(Get-Random)"
} | ConvertTo-Json
$pay = Show "POST /payments" { Invoke-RestMethod "$base/payments" -Method Post -ContentType "application/json" -Body $payBody }

$after = Show "GET  /appointments?patient_id (after payment)" { Invoke-RestMethod "$base/appointments?patient_id=$pid_" }
$mine = $after.appointments | Where-Object { $_.id -eq $appt.appointment.id }
Write-Output "      after payment: status=$($mine.status) payment_status=$($mine.payment_status) doctor=$($mine.doctor_name)"

# --- doctor_user_id resolution ---
$byDoc = Show "GET  /appointments?doctor_user_id" { Invoke-RestMethod "$base/appointments?doctor_user_id=$($doc.profile_id)" }
Write-Output "      doctor queue count=$($byDoc.appointments.Count)"

# --- PATCH appointment ---
Show "PATCH /appointments/[id]" { Invoke-RestMethod "$base/appointments/$($appt.appointment.id)" -Method Patch -ContentType "application/json" -Body '{"status":"COMPLETED","notes":"SMOKE TEST clinical note","updated_by":"smoke"}' } | Out-Null

# --- PATCH doctor ---
Show "PATCH /doctors/[id]" { Invoke-RestMethod "$base/doctors/$($doc.id)" -Method Patch -ContentType "application/json" -Body '{"is_verified":true,"updated_by":"smoke"}' } | Out-Null

# --- notifications PATCH ---
$n = (Invoke-RestMethod "$base/notifications?user_id=$pid_").notifications[0]
if ($n) { Show "PATCH /notifications" { Invoke-RestMethod "$base/notifications" -Method Patch -ContentType "application/json" -Body (@{id=$n.id} | ConvertTo-Json) } | Out-Null }

# --- specializations create/delete ---
$specName = "SmokeSpecialty$(Get-Random)"
Show "POST /specializations" { Invoke-RestMethod "$base/specializations" -Method Post -ContentType "application/json" -Body (@{name=$specName; added_by="smoke"} | ConvertTo-Json) } | Out-Null
Show "DELETE /specializations" { Invoke-RestMethod "$base/specializations?name=$specName" -Method Delete } | Out-Null

# --- register duplicate rejection ---
Show "POST /auth/register (duplicate rejected)" {
  try { Invoke-RestMethod "$base/auth/register" -Method Post -ContentType "application/json" -Body '{"full_name":"Dup","email":"patient@ug.edu.gh"}'; throw "accepted duplicate" }
  catch { if ($_.Exception.Response.StatusCode.value__ -eq 409) { "409 as expected" } else { throw } }
} | Out-Null

Write-Output ""
Write-Output "Created test records: triage=$($triage.triage.id) appointment=$($appt.appointment.id)"
