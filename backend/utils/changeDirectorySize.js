import Directory from '../models/directoryModel.js'

export const updateParentDirectorySize = async (parentDirectoryId, deltasize) => {
  const parents = [];

  while (parentDirectoryId) {
    const parentDirectory = await Directory.findById(
      parentDirectoryId,
      "parentDirId"
    );
    if (!parentDirectory) break;
    parents.push(parentDirectory._id);
    parentDirectoryId = parentDirectory.parentDirId;
  }
  if (parents.length > 0) {
    await Directory.updateMany(
      { _id: { $in: parents } },
      { $inc: { size: deltasize } }
    );
  }
};