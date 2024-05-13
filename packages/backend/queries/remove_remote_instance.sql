-- so turns out that an instnace is pure shit. Or that you got yourself your instance to refer itself somehow. well fuck--
-- we need the id of the instance to remove and the id of the "removed user" that all post with no user go to.

select * from federatedHosts where displayName like 'PROBLEMATIC_INSTANCE_HERE'

-- wafrn deleted user uuid: 066f4e2d-f407-452d-9603-8dbc5fd0d52a

-- we edit post
update posts SET userId='DELETED_USER_ID' where userId in (select id from users where users.federatedHostId like'ID_OF_INSTANCE')
-- we remove mentions
delete from postMentionsUserRelations where userId in (select id from users where users.federatedHostId like'ID_OF_INSTANCE');
-- we remove likes
delete from userLikesPostRelations where userId in (select id from users where users.federatedHostId like'ID_OF_INSTANCE');
-- we remove follows
delete from follows where followedId in (select id from users where users.federatedHostId like'ID_OF_INSTANCE');
delete from follows where followerId in (select id from users where users.federatedHostId like'ID_OF_INSTANCE');
-- we remove users
DELETE FROM users where users.federatedHostId like 'ID_OF_INSTANCE'
-- we delete instance
DELETE FROM federatedHosts where id like 'ID_OF_INSTANCE'