## @nqminds/cyber-demonstrator app

First, either:

- follow the steps in [../openssl-vuln-poc](../openssl-vuln-poc/README.md) to
  start the emulated Morello environment, or
- follow the instructions in https://github.com/nqminds/cyber/pull/27
  to mock the server responses

Then, you can run the app server with:

```bash
cd packages/app
npm run dev
```

Open [http://localhost:8082](http://localhost:8082)
