const WorkDay = require('../models/WorkDay');
const User = require('../models/User');
const { isHoliday } = require('../utils/holidays');

exports.markDay = async (req, res) => {
  try {
    const { date, status } = req.body; // status: 'WORKED', 'LEAVE', 'NONE'
    
    const userId = req.user.id;

    let workDay = await WorkDay.findOne({ user: userId, date });

    if (status === 'NONE') {
      if (workDay) {
        await WorkDay.findByIdAndDelete(workDay._id);
      }
      return res.json({ message: 'Day cleared', date, status: 'NONE' });
    }

    const isWorked = status === 'WORKED';
    const isLeaveTaken = status === 'LEAVE';

    if (workDay) {
      workDay.isWorked = isWorked;
      workDay.isLeaveTaken = isLeaveTaken;
      await workDay.save();
    } else {
      workDay = new WorkDay({
        user: userId,
        date,
        isWorked,
        isLeaveTaken
      });
      await workDay.save();
    }

    res.json(workDay);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getWorkDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const workDays = await WorkDay.find({ user: userId });
    res.json(workDays);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const workDays = await WorkDay.find({ user: userId });

    let regularWorkedDays = 0;
    let workedHolidays = 0;
    let takenLeaves = 0;
    
    workDays.forEach(day => {
      if (day.isLeaveTaken) {
        takenLeaves++;
      } else if (day.isWorked) {
        if (isHoliday(day.date)) {
          workedHolidays++;
        } else {
          regularWorkedDays++;
        }
      }
    });

    const earnedLeavesFromWork = Math.floor(regularWorkedDays / 7) + (user.earnedLeavesOffset || 0);
    const totalExtraLeaves = workedHolidays + (user.extraLeavesOffset || 0);
    const finalTakenLeaves = takenLeaves + (user.takenLeavesOffset || 0);

    const totalLeavesAvailable = user.initialLeaves + earnedLeavesFromWork + totalExtraLeaves - finalTakenLeaves;

    res.json({
      initialLeaves: user.initialLeaves,
      regularWorkedDays,
      workedHolidays,
      takenLeaves: finalTakenLeaves,
      earnedLeavesFromWork,
      totalExtraLeaves,
      totalLeavesAvailable,
      offsets: {
        earnedLeavesOffset: user.earnedLeavesOffset || 0,
        extraLeavesOffset: user.extraLeavesOffset || 0,
        takenLeavesOffset: user.takenLeavesOffset || 0
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateStats = async (req, res) => {
  try {
    const { initialLeaves, earnedLeavesOffset, extraLeavesOffset, takenLeavesOffset } = req.body;
    const user = await User.findById(req.user.id);
    
    if (initialLeaves !== undefined) user.initialLeaves = initialLeaves;
    if (earnedLeavesOffset !== undefined) user.earnedLeavesOffset = earnedLeavesOffset;
    if (extraLeavesOffset !== undefined) user.extraLeavesOffset = extraLeavesOffset;
    if (takenLeavesOffset !== undefined) user.takenLeavesOffset = takenLeavesOffset;

    await user.save();
    res.json({ message: 'Stats updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
