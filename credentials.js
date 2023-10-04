const credentials = [];

const getCredentials = () => {
  return credentials;
};
const getCredential = (id) => {
  return credentials.filter((credential) => credential.id === id)[0];
};
const setCredential = (data) => {
  if (credentials.find((cre) => cre.id === data.id))
    credentials = credentials.map((cre) =>
      cre.id === data.id ? { ...data } : { ...cre }
    );
  else credentials.push(data);
};
