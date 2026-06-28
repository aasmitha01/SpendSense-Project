import Sidebar from "../components/Sidebar";

function Profile() {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6">

        <h1 className="text-3xl font-bold mb-6">
          Profile
        </h1>

        <div className="bg-white rounded-xl p-6 shadow-sm max-w-xl">

          <h2 className="text-xl font-semibold mb-4">
            User Details
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-gray-500">
                Name
              </p>

              <p className="font-medium">
                {user?.name}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Email
              </p>

              <p className="font-medium">
                {user?.email}
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

export default Profile;