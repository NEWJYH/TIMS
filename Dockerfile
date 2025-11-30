FROM node:20

# 1. 작업 디렉토리 설정
WORKDIR /workspace/

# 2. 파일 복사 
COPY ./package.json ./
COPY ./yarn.lock ./

# 3. 설치
RUN yarn install

# 4. 소스 복사
COPY . .

# 5. 실행
RUN yarn seed
CMD ["yarn", "start:dev"]