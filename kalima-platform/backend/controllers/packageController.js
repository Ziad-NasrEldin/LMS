const Package = require("../models/packageModel");
const Lecturer = require("../models/lecturerModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const QueryFeatures = require("../utils/queryFeatures");

exports.createPackage = catchAsync(async (req, res, next) => {
  //this handling will be removed after handling with joi
  if (!req.body.name || !req.body.type || !req.body.price || !req.body.points) {
    return next(
      new AppError("Please provide name, type ,points and price", 400)
    );
  }
  let lecturers = req.body.points.map((point) =>
    Lecturer.findById(point.lecturer)
  );
  lecturers = await Promise.all(lecturers);
  if (lecturers.includes(null)) {
    return next(new AppError("Invalid lecturer ID", 400));
  }

  const newPackage = await Package.create(req.body);
  res.status(201).json({ status: "success", data: { package: newPackage } });
});

exports.getAllPackages = catchAsync(async (req, res, next) => {
  let query = Package.find();
  const features = new QueryFeatures(query, req.query)
    .filter()
    .sort()
    .paginate();

  const packages = await features.query
    .populate({
      path: "points.lecturer",
      select: "name",
    })
    .lean();
  res.status(200).json({
    status: "success",
    results: packages.length,
    data: { packages },
  });
});

exports.getPackageById = catchAsync(async (req, res, next) => {
  const package = await Package.findById(req.params.id)
    .populate({
      path: "points.lecturer",
      select: "name",
    })
    .lean();
  if (!package) return next(new AppError("No package found", 404));
  res.status(200).json({
    status: "success",
    data: { package },
  });
});

//update all package fields except points
exports.updatePackage = catchAsync(async (req, res, next) => {
  if (req.body.points) {
    return next(new AppError("You cannot update points", 400));
  }
  const updatedPackage = await Package.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedPackage) return next(new AppError("No package found", 404));
  res.status(200).json({
    status: "success",
    data: { package: updatedPackage },
  });
});
//update package points only
exports.managePackagePoints = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { operation, lecturerId, points } = req.body;

  if (!operation) {
    return next(
      new AppError(
        "Please specify an operation: 'add', 'remove', or 'update'",
        400
      )
    );
  }
  let updatedPackage;

  switch (operation.toLowerCase()) {
    case "add":
      if (!lecturerId || !points) {
        return next(
          new AppError(
            "Adding points requires lecturerId and points values",
            400
          )
        );
      }
      const lecturer = await Lecturer.findById(lecturerId);
      if (!lecturer) {
        return next(new AppError("Invalid lecturer ID", 400));
      }
      const existingPackage = await Package.findOne({
        _id: id,
        "points.lecturer": lecturerId,
      });
      if (existingPackage) {
        return next(
          new AppError("This lecturer already exists in the package", 400)
        );
      }
      updatedPackage = await Package.findByIdAndUpdate(
        id,
        { $push: { points: { lecturer: lecturerId, points } } },
        { new: true, runValidators: true }
      );
      break;

    case "remove":
      if (!lecturerId) {
        return next(new AppError("Removing points requires lecturerId", 400));
      }

      updatedPackage = await Package.findByIdAndUpdate(
        id,
        { $pull: { points: { lecturer: lecturerId } } },
        { new: true }
      );
      break;

    case "update":
      if (!lecturerId || !points) {
        return next(
          new AppError(
            "Updating points requires lecturerId and points values",
            400
          )
        );
      }

      updatedPackage = await Package.findByIdAndUpdate(
        id,
        { $set: { "points.$[elem].points": points } },
        {
          new: true,
          arrayFilters: [{ "elem.lecturer": lecturerId }],
        }
      );
      break;

    default:
      return next(
        new AppError("Invalid operation. Use 'add', 'remove', or 'update'", 400)
      );
  }

  if (!updatedPackage) {
    return next(new AppError("Package not found or operation failed", 404));
  }

  res.status(200).json({
    status: "success",
    data: { package: updatedPackage },
  });
});
exports.deletePackage = catchAsync(async (req, res, next) => {
  const deleted = await Package.findByIdAndDelete(req.params.id);
  if (!deleted) return next(new AppError("No package found", 404));
  res.status(204).json({ status: "success", data: null });
});
