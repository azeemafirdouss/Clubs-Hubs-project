// Create new file: faculty-dashboard.js

window.onload = async function() {
    const role = localStorage.getItem('role');
    if (!getToken() || role !== "faculty") {
        alert("Please login as Faculty first!");
        window.location.href = "login.html";
        return;
    }
    document.getElementById("today-date").innerText = new Date().toDateString();

    // Fetch all data from the new, combined dashboard endpoint
    const res = await apiRequest("/faculty/dashboard?_=" + new Date().getTime());
    if (res.error) {
        document.body.innerHTML = `<h2>Error: ${res.error}</h2>`;
        return;
    }

    // Populate the dashboard cards with real data
    document.querySelector('#pendingApprovalsCard p').innerText = res.pendingEvents.length;
    document.querySelector('#usersManagedCard p').innerText = res.allUsers.length;
    // ... you can add more for other cards

    renderPendingEvents(res.pendingEvents);
    renderClubs(res.clubs);
    renderUsers(res.allUsers);
};

function renderPendingEvents(events) {
    const list = document.getElementById("pendingEventsList");
    if (!events || events.length === 0) {
        list.innerHTML = "<li class='text-gray-500'>No pending event approvals.</li>";
        return;
    }
    list.innerHTML = events.map(event => `
        <li class="flex justify-between items-center p-3 bg-gray-100 rounded">
            <div>
                <p><strong>${event.title}</strong> (from ${event.club.name})</p>
                <p class="text-sm text-gray-600">${event.description}</p>
            </div>
            <div>
                <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" onclick="respondToEvent('${event._id}', 'approved')">Approve</button>
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded ml-2" onclick="respondToEvent('${event._id}', 'rejected')">Reject</button>
            </div>
        </li>
    `).join("");
}

// AFTER
// In faculty-dashboard.js

function renderUsers(users) {
    const tbody = document.getElementById("manageUsersTableBody");
    if (!users || users.length === 0){
        tbody.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-gray-500">No users found.</td></tr>`;
        return;
    }
    tbody.innerHTML = users.map(user => `
        <tr>
            <td class="p-2 border">${user.username}</td>
            <td class="p-2 border">${user.role}</td>
            <td class="p-2 border"> 
                </td>
        </tr>
    `).join("");
}

function renderClubs(clubs) {
    // This is the new part for viewing all clubs
    // Create a container in your HTML like <div id="clubDetailsContainer"></div>
    const container = document.getElementById("clubDetailsContainer");
    container.innerHTML = `<h2 class="text-xl font-bold text-gray-800 mb-4">Club Details</h2>`;
    container.innerHTML += clubs.map(club => `
        <div class="border p-4 rounded-lg mb-4">
            <p><strong>Club Name:</strong> ${club.name}</p>
            <p><strong>Club Head:</strong> ${club.headUsername}</p>
            <p><strong>Members:</strong> ${club.members.length}</p>
        </div>
    `).join("");
}

async function respondToEvent(eventId, action) {
    if (!confirm(`Are you sure you want to ${action} this event?`)) return;
    const res = await apiRequest("/faculty/events/respond", "POST", { eventId, action });
    if (res.message) {
        alert(res.message);
        window.location.reload();
    } else {
        alert("Error: " + (res.error || "Failed to respond."));
    }
}



function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}