const $ = (id) => document.getElementById(id);
let state = { students: [], clubs: [], memberships: [], events: [] };
const icons = ["⌘", "◉", "♧", "✦", "◇", "⌁"];
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
async function api(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function notify(message, type = "success") {
  const el = $("message"); el.textContent = message; el.className = `message ${type}`;
  window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => el.classList.add("hidden"), 4500);
}
function options(items, labelFn, placeholder = "Choose...") {
  return `<option value="">${placeholder}</option>` + items.map(x => `<option value="${x.id}">${esc(labelFn(x))}</option>`).join("");
}
function render() {
  $("studentCount").textContent = state.students.length;
  $("clubCount").textContent = state.clubs.length;
  $("membershipCount").textContent = state.memberships.length;
  $("eventCount").textContent = state.events.length;
  const search = ($("studentSearch").value || "").toLowerCase();
  $("studentsTable").innerHTML = state.students.filter(s => `${s.name} ${s.rollNo} ${s.department}`.toLowerCase().includes(search)).map(s => `<tr><td><span class="person">${esc(s.name)}</span></td><td>${esc(s.rollNo)}</td><td>${esc(s.department)}</td><td>${esc(s.year)}${s.year == 1 ? "st" : s.year == 2 ? "nd" : s.year == 3 ? "rd" : "th"} year</td><td><button class="btn btn-danger" onclick="deleteStudent(${s.id})">Delete</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">No students found.</td></tr>`;
  $("clubsGrid").innerHTML = state.clubs.map((c,i) => `<article class="club-card"><div class="club-card-head"><div class="club-symbol">${icons[i % icons.length]}</div><span class="pill">${state.memberships.filter(m => m.clubId === c.id).length} members</span></div><h3>${esc(c.name)}</h3><p>${esc(c.category)} community</p><button class="btn btn-danger" onclick="deleteClub(${c.id})">Delete club</button></article>`).join("") || `<div class="panel empty">No clubs yet. Add one above.</div>`;
  $("membershipStudent").innerHTML = options(state.students, s => `${s.name} (${s.rollNo})`, "Select student");
  $("membershipClub").innerHTML = options(state.clubs, c => c.name, "Select club");
  $("membershipsTable").innerHTML = state.memberships.map(m => `<tr><td><span class="person">${esc(m.student?.name || "Unknown")}</span><span class="subtext">${esc(m.student?.rollNo || "")}</span></td><td>${esc(m.club?.name || "Unknown")}</td><td><span class="pill">${esc(m.club?.category || "")}</span></td><td><button class="btn btn-danger" onclick="deleteMembership(${m.studentId},${m.clubId})">Remove</button></td></tr>`).join("") || `<tr><td colspan="4" class="empty">No memberships yet.</td></tr>`;
  $("eventClubOptions").innerHTML = state.clubs.map(c => `<label><input type="checkbox" name="requiredClubIds" value="${c.id}"> ${esc(c.name)}</label>`).join("") || `<span class="empty">Create a club first.</span>`;
  $("eventsGrid").innerHTML = state.events.map(e => `<article class="event-card"><span class="event-date">${esc(e.date)}</span><h3>${esc(e.name)}</h3><p>⌖ ${esc(e.venue)}</p><p>Required: ${e.requiredClubs?.length ? e.requiredClubs.map(c => esc(c.name)).join(", ") : "No club requirement"}</p><button class="btn btn-soft" onclick="showEligible(${e.id})">View eligible students</button><button class="btn btn-danger" onclick="deleteEvent(${e.id})">Delete event</button></article>`).join("") || `<div class="panel empty">No events yet. Create an event above.</div>`;
  const oldA = $("clubA").value, oldB = $("clubB").value;
  $("clubA").innerHTML = options(state.clubs, c => c.name, "Choose club A");
  $("clubB").innerHTML = options(state.clubs, c => c.name, "Choose club B");
  if (state.clubs.some(c => String(c.id) === oldA)) $("clubA").value = oldA;
  if (state.clubs.some(c => String(c.id) === oldB)) $("clubB").value = oldB;
  if (!$("clubA").value && state.clubs[0]) $("clubA").value = state.clubs[0].id;
  if (!$("clubB").value && state.clubs[1]) $("clubB").value = state.clubs[1].id;
}
async function refreshAll() {
  try {
    [state.students, state.clubs, state.memberships, state.events] = await Promise.all([
      api("/api/students"), api("/api/clubs"), api("/api/memberships"), api("/api/events")
    ]);
    render();
  } catch (e) { notify(e.message, "error"); }
}
async function runAction(action, successMessage) { try { await action(); await refreshAll(); notify(successMessage); } catch (e) { notify(e.message, "error"); } }
$("studentForm").addEventListener("submit", async e => {
  e.preventDefault(); const form = Object.fromEntries(new FormData(e.target).entries());
  await runAction(() => api("/api/students", { method: "POST", body: JSON.stringify(form) }), "Student added successfully."); e.target.reset();
});
$("clubForm").addEventListener("submit", async e => {
  e.preventDefault(); const form = Object.fromEntries(new FormData(e.target).entries());
  await runAction(() => api("/api/clubs", { method: "POST", body: JSON.stringify(form) }), "Club created successfully."); e.target.reset();
});
$("membershipForm").addEventListener("submit", async e => {
  e.preventDefault(); const form = Object.fromEntries(new FormData(e.target).entries());
  await runAction(() => api("/api/memberships", { method: "POST", body: JSON.stringify(form) }), "Membership added successfully."); e.target.reset();
});
$("eventForm").addEventListener("submit", async e => {
  e.preventDefault(); const form = new FormData(e.target);
  const payload = { name: form.get("name"), date: form.get("date"), venue: form.get("venue"), requiredClubIds: form.getAll("requiredClubIds") };
  await runAction(() => api("/api/events", { method: "POST", body: JSON.stringify(payload) }), "Event created successfully."); e.target.reset();
});
$("studentSearch").addEventListener("input", render);
$("analyzeBtn").addEventListener("click", analyze);
async function deleteStudent(id) { if (confirm("Delete this student and their memberships?")) await runAction(() => api(`/api/students/${id}`, { method: "DELETE" }), "Student deleted."); }
async function deleteClub(id) { if (confirm("Delete this club and its memberships?")) await runAction(() => api(`/api/clubs/${id}`, { method: "DELETE" }), "Club deleted."); }
async function deleteMembership(studentId, clubId) { await runAction(() => api(`/api/memberships?studentId=${studentId}&clubId=${clubId}`, { method: "DELETE" }), "Membership removed."); }
async function deleteEvent(id) { if (confirm("Delete this event?")) await runAction(() => api(`/api/events/${id}`, { method: "DELETE" }), "Event deleted."); }
async function showEligible(id) {
  try {
    const result = await api(`/api/events/${id}/eligible`);
    const names = result.eligible.map(s => `${s.name} (${s.rollNo})`).join("\n") || "No students currently meet the requirements.";
    alert(`${result.event.name}\n\nEligible students (${result.eligible.length}):\n${names}\n\nRule: ${result.rule}`);
  } catch (e) { notify(e.message, "error"); }
}
function renderSetCard(title, symbol, students) {
  return `<article class="result-card"><span class="set-symbol">${symbol}</span><h3>${title}</h3><p>${students.length} student(s)</p><div class="result-list">${students.map(s => `<span class="student-chip">${esc(s.name)} · ${esc(s.rollNo)}</span>`).join("") || `<span class="empty">The set is empty.</span>`}</div></article>`;
}
async function analyze() {
  const a = $("clubA").value, b = $("clubB").value;
  if (!a || !b) return notify("Create at least two clubs and select both clubs.", "error");
  try {
    const result = await api(`/api/analysis?clubA=${a}&clubB=${b}`);
    $("unionCount").textContent = result.counts.union;
    $("intersectionCount").textContent = result.counts.intersection;
    $("onlyACount").textContent = result.counts.onlyA;
    $("onlyBCount").textContent = result.counts.onlyB;
    $("analysisResults").innerHTML =
      renderSetCard(`Club A · ${result.clubA.name}`, "A", result.sets.a) +
      renderSetCard(`Club B · ${result.clubB.name}`, "B", result.sets.b) +
      renderSetCard("Union · A ∪ B", "∪", result.sets.union) +
      renderSetCard("Intersection · A ∩ B", "∩", result.sets.intersection) +
      renderSetCard("Difference · A − B", "A−B", result.sets.onlyA) +
      renderSetCard("Difference · B − A", "B−A", result.sets.onlyB);
  } catch (e) { notify(e.message, "error"); }
}
refreshAll();
