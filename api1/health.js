export default function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET requests
    res.status(200).json({ message: 'Hello, world!' });
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
