// ideally we end up with a better way to share code between the app and the
// kernels. because of the Docker build the latter can't import outside of
// it's folder
export { default } from "../../kernels/nodejs/superjson";
