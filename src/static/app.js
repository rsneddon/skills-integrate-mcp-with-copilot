document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const searchInput = document.getElementById("search");
  const categoryFilter = document.getElementById("category-filter");
  const venueFilter = document.getElementById("venue-filter");
  const dateFilter = document.getElementById("date-filter");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let allActivities = {};

  function renderFilters(activities) {
    const categories = new Set();
    const venues = new Set();
    const dates = new Set();

    Object.values(activities).forEach((details) => {
      if (details.category) categories.add(details.category);
      if (details.venue) venues.add(details.venue);
      if (details.date) dates.add(details.date);
    });

    categoryFilter.innerHTML = '<option value="">All categories</option>';
    venueFilter.innerHTML = '<option value="">All venues</option>';
    dateFilter.innerHTML = '<option value="">All dates</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    venues.forEach((venue) => {
      const option = document.createElement("option");
      option.value = venue;
      option.textContent = venue;
      venueFilter.appendChild(option);
    });

    dates.forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      dateFilter.appendChild(option);
    });
  }

  function filterActivities() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const venue = venueFilter.value;
    const date = dateFilter.value;

    return Object.entries(allActivities).filter(([name, details]) => {
      const matchesSearch =
        name.toLowerCase().includes(query) ||
        details.description.toLowerCase().includes(query) ||
        details.schedule.toLowerCase().includes(query);

      const matchesCategory = !category || details.category === category;
      const matchesVenue = !venue || details.venue === venue;
      const matchesDate = !date || details.date === date;

      return matchesSearch && matchesCategory && matchesVenue && matchesDate;
    });
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select an activity --";
    activitySelect.appendChild(defaultOption);

    if (activities.length === 0) {
      activitiesList.innerHTML =
        "<p>No activities match your search or filters.</p>";
      return;
    }

    activities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const waitlistText = details.waitlist && details.waitlist.length > 0
        ? `<p><strong>Waitlist:</strong> ${details.waitlist.length} student(s)</p>`
        : "";

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Category:</strong> ${details.category}</p>
        <p><strong>Date:</strong> ${details.date}</p>
        <p><strong>Venue:</strong> ${details.venue}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        ${waitlistText}
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      renderFilters(allActivities);
      renderActivities(filterActivities());
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function applyFilters() {
    renderActivities(filterActivities());
  }

  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
  venueFilter.addEventListener("change", applyFilters);
  dateFilter.addEventListener("change", applyFilters);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
