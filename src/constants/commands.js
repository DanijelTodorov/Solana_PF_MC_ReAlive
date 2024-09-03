const startCommand = {
  command: 'start',
  description: 'Start detection of token reaches 10K$',
};

const stopCommand = {
  command: 'stop',
  description: 'Stop detection of token',
};

const setLowLimitCommand = {
  command: 'setlowlimit',
  description: 'Stop detection of token',
};


const commands = [startCommand, stopCommand, setLowLimitCommand];

module.exports = commands;
