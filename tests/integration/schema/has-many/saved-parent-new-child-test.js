import Mirage from 'ember-cli-mirage';
import Model from 'ember-cli-mirage/orm/model';
import Schema from 'ember-cli-mirage/orm/schema';
import Db from 'ember-cli-mirage/orm/db';
import {module, test} from 'qunit';

module('mirage:integration:schema:hasMany#saved-parent-new-child', {
  beforeEach: function() {
    var db = new Db({
      users: [
        {id: 1, name: 'Link'},
      ],
      addresses: [
        {id: 1, name: '123 Hyrule Way'},
        {id: 2, name: '12 Goron City'},
      ]
    });
    this.schema = new Schema(db);

    var User = Model.extend({
      addresses: Mirage.hasMany()
    });
    var Address = Model.extend();

    this.schema.registerModels({
      user: User,
      address: Address
    });

    this.parent = this.schema.user.find(1);
    this.newChild = this.parent.newAddress({name: 'newAddr'});
  }
});

// Create
test('the parent can create a new saved child model', function(assert) {
  var springfield = this.parent.createAddress({name: '1 Springfield ave'});

  assert.ok(springfield.id, 'the child was persisted');
  assert.equal(springfield.name, '1 Springfield ave');
  assert.equal(springfield.user_id, 1);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[0], springfield);
  assert.deepEqual(this.parent.addresses[1], this.newChild);
  assert.deepEqual(this.parent.address_ids, [springfield.id, undefined]);
});

test('the parent can create a new unsaved child model', function(assert) {
  var hudson = this.parent.newAddress({name: '2 Hudson st'});

  assert.ok(!hudson.id, 'the child was not persisted');
  assert.equal(hudson.name, '2 Hudson st');
  assert.equal(hudson.user_id, 1);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[1], hudson);
  assert.deepEqual(this.parent.address_ids, [undefined, undefined]);
});

// Read
test('the parent references its children, and ids are correct', function(assert) {
  assert.equal(this.parent.addresses.length, 1);
  assert.deepEqual(this.parent.addresses[0], this.newChild);
  assert.deepEqual(this.parent.address_ids, [undefined]);
});

// Update
test('the parent can update its relationship to saved children via child_ids', function(assert) {
  var unrelatedChild1 = this.schema.address.find(1);
  var unrelatedChild2 = this.schema.address.find(2);

  this.parent.address_ids = [1, 2];
  unrelatedChild1.reload();
  unrelatedChild2.reload();

  assert.deepEqual(this.parent.address_ids, [1, 2]);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[0], unrelatedChild1);
  assert.deepEqual(this.parent.addresses[1], unrelatedChild2);
});

test('the parent can update its relationship to saved children via .children', function(assert) {
  var unrelatedChild1 = this.schema.address.find(1);
  var unrelatedChild2 = this.schema.address.find(2);

  this.parent.addresses = [unrelatedChild1, unrelatedChild2];
  unrelatedChild1.reload();
  unrelatedChild2.reload();

  assert.deepEqual(this.parent.address_ids, [1, 2]);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[0], unrelatedChild1);
  assert.deepEqual(this.parent.addresses[1], unrelatedChild2);
});

test('the parent can update its relationship to new children via .children', function(assert) {
  var newChild1 = this.schema.address.new({name: '1a'});
  var newChild2 = this.schema.address.new({name: '2b'});

  this.parent.addresses = [newChild1, newChild2];
  newChild1.reload();
  newChild2.reload();

  assert.ok(newChild1.id, 'the new child was saved');
  assert.deepEqual(this.parent.address_ids, [newChild1.id, newChild2.id]);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[0], newChild1);
  assert.deepEqual(this.parent.addresses[1], newChild2);
});

test('the parent can update its relationship to a mix of new and saved children via .children', function(assert) {
  var unrelatedChild = this.schema.address.find(1);
  var newChild = this.schema.address.new({name: 'abc'});

  this.parent.addresses = [unrelatedChild, newChild];
  unrelatedChild.reload();
  newChild.reload();

  assert.ok(newChild.id, 'the new child was saved');
  assert.deepEqual(this.parent.address_ids, [unrelatedChild.id, newChild.id]);
  assert.equal(this.parent.addresses.length, 2);
  assert.deepEqual(this.parent.addresses[0], unrelatedChild);
  assert.deepEqual(this.parent.addresses[1], newChild);
});

test('the parent can clear its relationship via children', function(assert) {
  this.parent.addresses = null;

  assert.deepEqual(this.parent.address_ids, []);
  assert.deepEqual(this.parent.addresses.length, 0);
});

test('the parent can clear its relationship via null child_ids', function(assert) {
  this.parent.address_ids = null;

  assert.deepEqual(this.parent.address_ids, []);
  assert.equal(this.parent.addresses.length, 0);
});

test('the parent can clear its relationship via [] child_ids', function(assert) {
  this.parent.address_ids = [];

  assert.deepEqual(this.parent.address_ids, []);
  assert.equal(this.parent.addresses.length, 0);
});
