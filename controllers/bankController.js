import BankDetail from "../models/BankDetailsModel.js";

// STORE OR ADD BANK/UPI DETAILS
export const storeBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ac_holder_name, ac_no, ifsc_code, branch_name, upi, isDefault } = req.body;

    // If setting this one as default, unset others first
    if (isDefault) {
      await BankDetail.update({ isDefault: false }, { where: { userId } });
    }

    if (!ac_holder_name) {
      return res.status(400).json({
        message: "Account holder name is required",
      });
    }

    if (!ac_no && !upi) {
      return res.status(400).json({
        message: "Either bank account or UPI details are required",
      });
    }

    const newDetail = await BankDetail.create({
      userId,
      ac_holder_name,
      ac_no,
      ifsc_code,
      branch_name,
      upi,
      isDefault: isDefault || false,
    });

    return res.status(201).json({
      message: "Bank details saved successfully",
      data: newDetail
    });
  } catch (error) {
    return res.status(500).json({ message: "Error saving details", error: error.message });
  }
};

// GET USER'S SAVED BANK DETAILS
export const getUserBankDetails = async (req, res) => {
  try {
    const details = await BankDetail.findAll({
      where: { userId: req.user.id },
      order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
    });
    return res.status(200).json(details);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching details", error: error.message });
  }
};

// UPDATE EXISTING BANK OR UPI DETAILS
export const updateBankDetails = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the specific bank detail to edit
    const { ac_no, ifsc_code, branch_name, ac_holder_name, upi, isDefault } = req.body;
    const userId = req.user.id;

    // 1. Find the existing detail and ensure it belongs to the logged-in user
    const bankDetail = await BankDetail.findOne({
      where: { id, userId }
    });

    if (!bankDetail) {
      return res.status(404).json({ message: "Bank details not found or unauthorized" });
    }

    // 2. Logic for managing default payment methods 
    // If the user is setting this record as default, unset any previous default
    if (isDefault === true) {
      await BankDetail.update(
        { isDefault: false },
        { where: { userId } }
      );
    }

    // 3. Perform the update
    await bankDetail.update({
      ac_no: ac_no !== undefined ? ac_no : bankDetail.ac_no,
      ifsc_code: ifsc_code !== undefined ? ifsc_code : bankDetail.ifsc_code,
      branch_name: branch_name !== undefined ? branch_name : bankDetail.branch_name,
      ac_holder_name: ac_holder_name || bankDetail.ac_holder_name,
      upi: upi !== undefined ? upi : bankDetail.upi,
      isDefault: isDefault !== undefined ? isDefault : bankDetail.isDefault,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      message: "Bank details updated successfully",
      data: bankDetail
    });
  } catch (error) {
    console.error("Update Bank Detail Error:", error);
    return res.status(500).json({
      message: "Failed to update bank details",
      error: error.message
    });
  }
};

export const deleteBankDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const detail = await BankDetail.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!detail) {
      return res.status(404).json({
        message: "Bank detail not found",
      });
    }

    await detail.destroy();

    return res.json({
      message: "Bank detail deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete bank detail",
      error: error.message,
    });
  }
};