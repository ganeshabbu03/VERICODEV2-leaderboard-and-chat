const User = require("../models/user.model");

const getProfile = async (req, res) => {
    try {

        const user = await User.findByPk(req.user.id, {
            attributes: [
                "id",
                "name",
                "email",
                "provider",
                "email_verified",
                "created_at"
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getProfile
};