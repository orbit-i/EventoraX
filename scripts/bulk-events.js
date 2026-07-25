const modes = ["ONLINE", "OFFLINE", "HYBRID"];
const statuses = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"];
const topics = ["Technology", "Business", "Healthcare", "Education", "Design"];
const organizers = ["CS Society", "Business Club", "Med Society", "Design Guild"];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function createEvents() {
  for (let i = 1; i <= 20; i++) {
    const start = daysFromNow(i * 3);
    const end = daysFromNow(i * 3 + 1);

    const body = {
      title: `Test Event ${i}`,
      organizer: organizers[i % organizers.length],
      mode: modes[i % modes.length],
      startDateTime: start,
      endDateTime: end,
      location: i % 2 === 0 ? "Main Hall" : null,
      description: `Sample event number ${i} for testing.`,
      topic: topics[i % topics.length],
      maxAttendees: 100 + i * 10,
      ticketPrice: i % 3 === 0 ? 0 : 10,
      registrationOpen: true,
      status: statuses[i % statuses.length],
    };

    const res = await fetch("http://localhost:3000/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (res.ok) {
      console.log(`Created: ${result.data.title} (${result.data.id})`);
    } else {
      console.log(`Failed on event ${i}:`, result.error);
    }
  }
}

createEvents();