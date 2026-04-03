window.onload = async function() {
   loadApprovedEvents();
  const role = localStorage.getItem('role');
  if (!getToken() || role !== "student"){
    alert("Please login as student first!");
    window.location.href = "login.html";
    return;
  }
  const res = await apiRequest("/student/dashboard");
  if (res.error) {
    document.body.innerHTML = "Unauthorized or error";
    return;
  }
  // document.getElementById("studentName").innerText = res.name;
  // document.getElementById("userName").innerText = res.name + " (" + res.rollNumber + ")";
  // This is the corrected code
document.getElementById("studentName").innerText = res.username;
document.getElementById("userName").innerText = res.username;
  document.getElementById("clubsCount").innerText = res.joinedClubs.length;
  document.getElementById("pendingCount").innerText = res.pendingRequests.length;
  // My Clubs
  document.getElementById("clubsList").innerHTML = res.joinedClubs.length
    ? res.joinedClubs.map(club => `<div class="p-3 border rounded">${club.name}</div>`).join("")
    : "<p class='text-gray-500'>No clubs joined yet</p>";
  // Pending Requests
  document.getElementById("pendingRequests").innerHTML = res.pendingRequests.length
    ? res.pendingRequests.map(club => `<div class="p-3 border rounded">${club.name}</div>`).join("")
    : "<p class='text-gray-500'>No pending requests</p>";
  // Explore Clubs
  const allClubsRes = await apiRequest("/clubs");
  const exploreClubsList = document.getElementById("exploreClubsList");
  if (allClubsRes.error || !Array.isArray(allClubsRes)) {
    exploreClubsList.innerHTML = `<p class='text-red-500'>Failed to load clubs</p>`;
    return;
  }
  // Get joined club IDs for quick lookup
  const joinedClubIds = new Set(res.joinedClubs.map(c => c._id || c.id));
  exploreClubsList.innerHTML = allClubsRes.length
    ? allClubsRes.map(club => {
        const isJoined = joinedClubIds.has(club._id || club.id);
        return `<div class="border rounded-lg p-4 flex flex-col items-center shadow">
          <img src="../images/${club.image || 'kmit.png'}" alt="${club.name}" class="h-20 w-20 object-contain mb-2" onerror="this.src='../images/kmit.png'" />
          <div class="font-bold text-lg mb-1 text-center">${club.name}</div>
          <div class="text-gray-500 text-sm mb-2 text-center">${club.description || ''}</div>
          <button class="${isJoined ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'} px-4 py-2 rounded text-white font-semibold w-full" ${isJoined ? 'disabled' : ''} onclick="${isJoined ? '' : `joinClub('${club._id || club.id}')`}">${isJoined ? 'Joined' : 'Join'}</button>
        </div>`;
      }).join("")
    : "<p class='text-gray-500'>No clubs available</p>";
    loadApprovedEvents(); 
};

async function leaveClub(clubId) {
  if (!confirm('Are you sure you want to leave this club?')) return;
  const res = await apiRequest("/student/leave-club", "POST", { clubId });
  if (res.message) {
    alert('Successfully left the club');
    window.location.reload();
  } else {
    alert('Error: ' + (res.error || 'Failed to leave club'));
  }
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
}
// Placeholder for joinClub (to be implemented later)
// In student-dashboard.js, find the joinClub function and REPLACE it with this:

async function joinClub(clubId) {
    if (!confirm('Are you sure you want to send a join request to this club?')) return;
    
    // Use your existing apiRequest function to call the new endpoint
    const res = await apiRequest("/student/join-club", "POST", { clubId });
    
    if (res.message) {
        alert(res.message);
        window.location.reload(); // Reload the page to update the UI
    } else {
        alert('Error: ' + (res.error || 'Failed to send request'));
    }
}

// async function loadApprovedEvents() {
//     const events = await apiRequest("/events/approved");
//     const list = document.getElementById("eventsList");
//     if (!events || events.length === 0) {
//         list.innerHTML = "<p class='text-gray-500'>No upcoming events.</p>";
//         return;
//     }
//     list.innerHTML = events.map(event => `
//         <div class="border p-3 rounded-lg">
//             <p><strong>${event.title}</strong> (Hosted by ${event.club.name})</p>
//             <p class="text-sm">${new Date(event.date).toLocaleString()}</p>
//         </div>
//     `).join("");
//     }
async function loadApprovedEvents() {
    const events = await apiRequest("/events/approved");
    const list = document.getElementById("eventsList");

    if (!events || events.length === 0) {
        list.innerHTML = "<p class='text-gray-500'>No upcoming events.</p>";
        return;
    }

    list.innerHTML = events.map(event => `
        <div class="border p-3 rounded-lg">
            <p><strong>${event.title}</strong></p>
            <p class="text-sm">Hosted by ${event.club?.name || event.clubName || "Unknown Club"}</p>
            <p class="text-sm">${new Date(event.date).toLocaleString()}</p>
        </div>
    `).join("");
}
