// Função principal que processa as requisições HTTP
// Esta é a função que será executada quando alguém acessar a API
export default function handler(request, response) {
  // Define o status da resposta como 200 (OK - sucesso)
  response.status(200);
  
  // Envia uma resposta em formato JSON para o cliente
  // JSON é o formato padrão para comunicação entre APIs
  response.json({
    mensagem: "Olá Mundo! 🌍",
    projeto: "Plugin Figma Backend",
    status: "Funcionando perfeitamente",
    timestamp: new Date().toISOString() // Adiciona a data/hora atual
  });
}