const bcrypt = require('bcryptjs');
const db = require('../../connect');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Owner.findAll();
}

async function getById(id) {
    return await getOwner(id);
}

async function create(params) {
    // validate
    if (await db.Owner.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const owner = new db.Owner(params);
    
    // hash password
    user.passwordHash = await bcrypt.hash(params.password, 10);

    // save user
    await owner.save();
}

async function update(id, params) {
    const user = await getOwner(id);

    // validate
    const usernameChanged = params.username && user.username !== params.username;
    if (usernameChanged && await db.Owner.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.passwordHash = await bcrypt.hash(params.password, 10);
    }

    // copy params to user and save
    Object.assign(user, params);
    await owner.save();
}

async function _delete(id) {
    const owner = await getOwner(id);
    await owner.destroy();
}

// helper functions

async function getOwner(id) {
    const owner = await db.Owner.findByPk(id);
    if (!owner) throw 'Shop owner not found';
    return owner;
}