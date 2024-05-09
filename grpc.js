const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

// Charge le service grpc et le fichier.proto
const PROTO_PATH = __dirname + '/my-service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const serviceProto = grpc.loadPackageDefinition(packageDefinition).myservice;

// Crée une connexion à la base de données MySQL
const connection = mysql.createConnection({
  host: 'Serveur : 127.0.0.1:3309',
  user: '',
  password: '',
  database: 'test'
});

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    throw err;
  }
  console.log('Connecté à la base de données MySQL');
});

// Définit le service grpc
const myService = {
  getRecord: (call, callback) => {
    const id = call.request.id;
    // Requête à la base de données pour obtenir le record avec l'ID spécifié
    connection.query('SELECT * FROM records WHERE id = ?', [id], (error, results) => {
      if (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        callback(error);
        return;
      }
      // Renvoie les données au client
      const record = results[0];
      if (record) {
        callback(null, { record });
      } else {
        callback({ code: grpc.status.NOT_FOUND, message: 'Enregistrement non trouvé' });
      }
    });
  }
};

// Démarre le serveur grpc
const server = new grpc.Server();
server.addService(serviceProto.MyService.service, myService);
server.bindAsync(
  '127.0.0.1:50051',
  grpc.ServerCredentials.createInsecure(),
  () => { 
    console.log('Écoute sur le port 50051');
    server.start();
  }
);
