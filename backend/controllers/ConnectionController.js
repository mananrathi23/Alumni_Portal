// Backend/controllers/ConnectionController.js
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Connection } from "../models/ConnectionModel.js";
import { Student } from "../models/StudentModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { emitToUser } from "../Socket.js";

// Helper — find any user by id and role
async function findUserByIdAndRole(id, role) {
  if (role === "Student") return await Student.findById(id);
  if (role === "Alumni")  return await Alumni.findById(id);
  if (role === "Teacher") return await Teacher.findById(id);
  return null;
}

// ── SEND CONNECTION REQUEST ───────────────────────────────────────────────────
// POST /api/v1/connections/send
// Body: { receiverId, receiverRole, note? }
export const sendConnectionRequest = catchAsyncError(async (req, res, next) => {
  const sender     = req.user;
  const senderRole = sender.constructor.modelName;
  const { receiverId, receiverRole, note } = req.body;

  if (!receiverId || !receiverRole) {
    return next(new ErrorHandler("Receiver ID and role are required.", 400));
  }

  if (sender._id.toString() === receiverId) {
    return next(new ErrorHandler("You cannot send a connection request to yourself.", 400));
  }

  const receiver = await findUserByIdAndRole(receiverId, receiverRole);
  if (!receiver) {
    return next(new ErrorHandler("Receiver not found.", 404));
  }

  const existingRequest = await Connection.findOne({
    $or: [
      { "sender.id": sender._id,  "receiver.id": receiverId },
      { "sender.id": receiverId,  "receiver.id": sender._id },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "Accepted") {
      return next(new ErrorHandler("You are already connected with this person.", 400));
    }
    if (existingRequest.status === "Pending") {
      return next(new ErrorHandler("A connection request is already pending.", 400));
    }
    // Rejected or Withdrawn — allow re-send
    if (existingRequest.status === "Rejected" || existingRequest.status === "Withdrawn") {
      existingRequest.status    = "Pending";
      existingRequest.note      = note || "";
      existingRequest.sender    = { id: sender._id,  name: sender.name,   role: senderRole   };
      existingRequest.receiver  = { id: receiverId,  name: receiver.name, role: receiverRole };
      existingRequest.updatedAt = Date.now();
      await existingRequest.save();

      // ✅ Notify receiver in real-time
      emitToUser(receiverId, "connection:new_request", {
        connectionId: existingRequest._id,
        sender: existingRequest.sender,
        status: "Pending",
      });

      return res.status(200).json({
        success: true,
        message: "Connection request sent.",
        request: existingRequest,
      });
    }
  }

  // Create brand new request
  const request = await Connection.create({
    sender:   { id: sender._id,  name: sender.name,   role: senderRole   },
    receiver: { id: receiverId,  name: receiver.name, role: receiverRole },
    note,
  });

  // ✅ Notify receiver in real-time
  emitToUser(receiverId, "connection:new_request", {
    connectionId: request._id,
    sender: request.sender,
    status: "Pending",
  });

  res.status(201).json({
    success: true,
    message: `Connection request sent to ${receiver.name}.`,
    request,
  });
});

// ── RESPOND TO REQUEST (Accept / Reject) ─────────────────────────────────────
// PUT /api/v1/connections/:requestId/respond
// Body: { status: "Accepted" | "Rejected" }
export const respondToRequest = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const user = req.user;

  if (!["Accepted", "Rejected"].includes(status)) {
    return next(new ErrorHandler("Status must be Accepted or Rejected.", 400));
  }

  const request = await Connection.findById(req.params.requestId);
  if (!request) {
    return next(new ErrorHandler("Connection request not found.", 404));
  }

  if (request.receiver.id.toString() !== user._id.toString()) {
    return next(new ErrorHandler("You can only respond to requests sent to you.", 403));
  }

  if (request.status !== "Pending") {
    return next(new ErrorHandler(`This request is already ${request.status}.`, 400));
  }

  request.status    = status;
  request.updatedAt = Date.now();
  await request.save();

  const event = status === "Accepted" ? "connection:accepted" : "connection:rejected";

  // ✅ Notify SENDER — their button changes to "✓ Connected" or resets
  emitToUser(request.sender.id, event, {
    connectionId: request._id,
    receiver: request.receiver,
    status: request.status,
  });

  // ✅ Notify RECEIVER (self) — so their own button also updates instantly
  emitToUser(request.receiver.id, event, {
    connectionId: request._id,
    sender: request.sender,
    status: request.status,
  });

  res.status(200).json({
    success: true,
    message: `Connection request ${status.toLowerCase()}.`,
    request,
  });
});

// ── WITHDRAW REQUEST ──────────────────────────────────────────────────────────
// DELETE /api/v1/connections/:requestId/withdraw
export const withdrawRequest = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  const request = await Connection.findById(req.params.requestId);
  if (!request) {
    return next(new ErrorHandler("Connection request not found.", 404));
  }

  if (request.sender.id.toString() !== user._id.toString()) {
    return next(new ErrorHandler("You can only withdraw your own requests.", 403));
  }

  if (request.status !== "Pending") {
    return next(new ErrorHandler("Only pending requests can be withdrawn.", 400));
  }

  request.status    = "Withdrawn";
  request.updatedAt = Date.now();
  await request.save();

  // ✅ Notify receiver — their Accept/Reject buttons disappear
  emitToUser(request.receiver.id, "connection:withdrawn", {
    connectionId: request._id,
    sender: request.sender,
  });

  res.status(200).json({
    success: true,
    message: "Connection request withdrawn.",
  });
});

// ── REMOVE CONNECTION ─────────────────────────────────────────────────────────
// DELETE /api/v1/connections/:requestId/remove
export const removeConnection = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  const request = await Connection.findById(req.params.requestId);
  if (!request) {
    return next(new ErrorHandler("Connection not found.", 404));
  }

  const isSender   = request.sender.id.toString()   === user._id.toString();
  const isReceiver = request.receiver.id.toString() === user._id.toString();

  if (!isSender && !isReceiver) {
    return next(new ErrorHandler("You are not part of this connection.", 403));
  }

  if (request.status !== "Accepted") {
    return next(new ErrorHandler("You can only remove accepted connections.", 400));
  }

  await request.deleteOne();

  // ✅ Notify the other person — their button resets to "+ Connect"
  const otherId = isSender ? request.receiver.id : request.sender.id;
  emitToUser(otherId, "connection:removed", {
    connectionId: request._id,
    removedBy: user.name,
  });

  res.status(200).json({
    success: true,
    message: "Connection removed.",
  });
});

// ── GET MY CONNECTIONS ────────────────────────────────────────────────────────
// GET /api/v1/connections
export const getMyConnections = catchAsyncError(async (req, res) => {
  const user = req.user;

  const connections = await Connection.find({
    status: "Accepted",
    $or: [
      { "sender.id":   user._id },
      { "receiver.id": user._id },
    ],
  }).sort({ updatedAt: -1 });

  const normalized = connections.map((c) => {
    const isSender = c.sender.id.toString() === user._id.toString();
    return {
      connectionId:  c._id,
      connectedWith: isSender ? c.receiver : c.sender,
      connectedAt:   c.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    count: normalized.length,
    connections: normalized,
  });
});

// ── GET PENDING REQUESTS ──────────────────────────────────────────────────────
// GET /api/v1/connections/pending
export const getPendingRequests = catchAsyncError(async (req, res) => {
  const user = req.user;

  const [incoming, outgoing] = await Promise.all([
    Connection.find({ "receiver.id": user._id, status: "Pending" }).sort({ createdAt: -1 }),
    Connection.find({ "sender.id":   user._id, status: "Pending" }).sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    incoming,
    outgoing,
  });
});

// ── CHECK CONNECTION STATUS ───────────────────────────────────────────────────
// GET /api/v1/connections/status/:userId
export const getConnectionStatus = catchAsyncError(async (req, res) => {
  const user     = req.user;
  const targetId = req.params.userId;

  const connection = await Connection.findOne({
    $or: [
      { "sender.id":   user._id,  "receiver.id": targetId },
      { "sender.id":   targetId,  "receiver.id": user._id },
    ],
  });

  if (!connection) {
    return res.status(200).json({
      success: true,
      status: "None",
      connection: null,
    });
  }

  const isSender = connection.sender.id.toString() === user._id.toString();

  res.status(200).json({
    success: true,
    status: connection.status,
    isSender,
    connectionId: connection._id,
    connection,
  });
});