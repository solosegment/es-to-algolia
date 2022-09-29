# How to use

Initialize: `yarn` or `yarn install`

Start parsing: `yarn start`

## Add Additional clients/indices

-   open the clients.yaml file
-   add a new client entry. All 3 fields are required

You can append something like this to the end of the file to add it to the list

```yaml
- clientName: "Deere"
  node: "http://10.10.10.88:9205"
  indexId: "deere-784967839"
```
