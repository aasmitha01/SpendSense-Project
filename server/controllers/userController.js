
const db = require("../config/db");

const updateProfile = (req, res) => {
  const { id } = req.params;

  const fullName = String(
    req.body.full_name || req.body.name || ""
  ).trim();

  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  const profilePhoto =
    req.body.profile_photo ?? null;

  if (!fullName || !email) {
    return res.status(400).json({
      message: "Full name and email are required.",
    });
  }

  if (fullName.length > 100 || email.length > 100) {
    return res.status(400).json({
      message: "Name and email must not exceed 100 characters.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address.",
    });
  }

  if (
    profilePhoto !== null &&
    typeof profilePhoto !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid profile photo.",
    });
  }

  if (
    profilePhoto &&
    profilePhoto.length > 3_000_000
  ) {
    return res.status(413).json({
      message: "Profile photo is too large. Use an image under 2 MB.",
    });
  }

  const sql = `
    UPDATE users
    SET full_name = ?,
        email = ?,
        profile_photo = COALESCE(?, profile_photo)
    WHERE id = ?
  `;

  db.query(
    sql,
    [fullName, email, profilePhoto, id],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "This email address is already in use.",
          });
        }

        console.error("Profile update error:", err);

        return res.status(500).json({
          message: "Failed to update profile.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      db.query(
        `SELECT id, full_name, email, profile_photo, created_at
         FROM users WHERE id = ?`,
        [id],
        (selectError, rows) => {
          if (selectError) {
            console.error("Profile fetch error:", selectError);

            return res.status(500).json({
              message: "Profile updated, but could not reload it.",
            });
          }

          return res.status(200).json({
            message: "Profile updated successfully.",
            user: rows[0],
          });
        }
      );
    }
  );
};

const getProfile = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT id, full_name, email, profile_photo, created_at
     FROM users WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        console.error("Get profile error:", err);

        return res.status(500).json({
          message: "Failed to fetch profile.",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.json(rows[0]);
    }
  );
};

module.exports = {
  getProfile,
  updateProfile,
};
