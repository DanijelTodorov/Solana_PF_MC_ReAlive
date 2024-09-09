const startCommand = {
  command: 'start',
  description: 'Start detection of tokens (default 80%)',
};

const stopCommand = {
  command: 'stop',
  description: 'Stop detection of token',
};

const setLowLimitCommand = {
  command: 'setlowlimit',
  description: 'Set low limit',
};

const getLowLimitCommand = {
  command: 'getlowlimit',
  description: 'Get low limit',
};


const commands = [startCommand, stopCommand, setLowLimitCommand, getLowLimitCommand];

module.exports = commands;
