FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Compile Solidity contracts
RUN npx hardhat compile

# Set environment variable for gas reporting
ENV REPORT_GAS=true

# Default command: run tests
CMD ["npx", "hardhat", "test"]
