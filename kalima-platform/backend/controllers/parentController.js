const Parent = require('../models/center.parentModel'); // Adjust path if needed
const CStudent = require('../models/center.studentModel'); // Adjust path if needed (for potential cleanup)

// --- Helper Function for Error Handling ---
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Create a new Parent ---
exports.createParent = handleAsync(async (req, res, next) => {
  // Password will be hashed by the pre-save hook in the model
  const newParent = await Parent.create(req.body);

  // Important: Exclude password from the response even though it's hashed
  newParent.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      parent: newParent,
    },
  });
});

// --- Get All Parents ---
exports.getAllParents = handleAsync(async (req, res, next) => {
  // Exclude password field explicitly if not using select: false in model (belt and braces)
  const parents = await Parent.find().select('-password').populate({
    path: 'children',
    select: 'name gender phone', // Select specific fields if needed
  });

  res.status(200).json({
    status: 'success',
    results: parents.length,
    data: {
      parents,
    },
  });
});

// --- Get Parent by ID ---
exports.getParentById = handleAsync(async (req, res, next) => {
  const parent = await Parent.findById(req.params.id).populate({
    path: 'children',
    select: 'name gender phone',
  }); // Populate children details

  if (!parent) {
    // Use a more specific error class if you have one
    return res.status(404).json({
      status: 'fail',
      message: 'No parent found with that ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      parent,
    },
  });
});

// --- Update Parent by ID ---
exports.updateParent = handleAsync(async (req, res, next) => {
  // Prevent password updates through this route for simplicity.
  // Handle password updates in a separate, dedicated route/controller.
  if (req.body.password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Password updates are not allowed via this route. Please use a dedicated password update endpoint.',
    });
  }

  const updatedParent = await Parent.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true, // Return the modified document rather than the original
      runValidators: true, // Ensure schema validators run on update
    }
  ).populate({
    path: 'children',
    select: 'name gender phone',
  });

  if (!updatedParent) {
    return res.status(404).json({
      status: 'fail',
      message: 'No parent found with that ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      parent: updatedParent,
    },
  });
});

// --- Delete Parent by ID ---
exports.deleteParent = handleAsync(async (req, res, next) => {
  const parentId = req.params.id;
  const parent = await Parent.findById(parentId);

  if (!parent) {
    return res.status(404).json({
      status: 'fail',
      message: 'No parent found with that ID',
    });
  }

  // --- Strategy for Handling Children (Choose one or adapt): ---
  // Option 1: Delete orphaned children (use with caution!)
  // await CStudent.deleteMany({ parent: parentId });

  // Option 2: Prevent deletion if parent has children
  if (parent.children && parent.children.length > 0) {
      return res.status(400).json({
          status: 'fail',
          message: 'Cannot delete parent with associated children. Please reassign or delete children first.'
      });
  }
  // Proceed with deleting the parent
  await Parent.findByIdAndDelete(parentId);

  res.status(204).json({ // 204 No Content - typical for successful delete
    status: 'success',
    data: null,
  });
});