In this example project explain how to implement Repository Pattern with low-level database driver. Created specially for [article on Dev.to](https://dev.to/fyapy/repository-pattern-with-typescript-and-native-postgresql-driver) :)

**I strongly ask you to make sure before using this solution in production in such things as:**
- You don't have good open source ORM/QueryBuilder/Library alternatives for your database.
- You have Experienced Developers who **fully understand** **what they are doing** and **why**.

But what if you can't answer `yes` to these questions?
I think you have taken on a task that is too difficult for you :)

Little bit about project:
Folders/files pefiexed with `fp` the same implementation, but using functional programming.

## Run project

Install dependencies:
```sh
yarn
```

Edit `DATABASE_URL` in .env file.

Run migrations:
```sh
yarn migrate:run
```

Run project:
```sh
yarn start
```
