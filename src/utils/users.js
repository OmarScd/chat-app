const users = [];

const addUser = ({ id, username, room }) => {
  // Clean the data
  const _username = username.trim().toLowerCase();
  const _room = room.trim().toLowerCase();

  // validate the data
  if (!_username || !_room) {
    return {
      error: 'Username and Room are required',
    };
  }

  // check for existing user
  if (users.some((user) => user.room === _room && user.username === _username)) {
    return {
      error: 'Username is in use',
    };
  }

  // store user
  const user = {
    id,
    username: _username,
    room: _room,
  };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => {
  const _room = room.trim().toLowerCase();
  return users.filter((user) => user.room === _room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
