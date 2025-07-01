import { useEffect, useState } from "react";

export default function UserList({ role }) {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const res = await fetch(`http://localhost:8000/admin/users/?role=${role}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [role]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    const res = await fetch(`http://localhost:8000/admin/users/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.status === 204) {
      loadUsers(); // reload users
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded mt-4">
      <h2 className="text-xl font-bold mb-2">All {role}s</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="border-b py-2 flex justify-between items-center">
            <span>{user.username} ({user.email})</span>
            <button
              onClick={() => handleDelete(user.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
