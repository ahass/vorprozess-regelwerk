# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["VorprozessRegelwerk.API/VorprozessRegelwerk.API.csproj", "VorprozessRegelwerk.API/"]
COPY ["VorprozessRegelwerk.Core/VorprozessRegelwerk.Core.csproj", "VorprozessRegelwerk.Core/"]
COPY ["VorprozessRegelwerk.Infrastructure/VorprozessRegelwerk.Infrastructure.csproj", "VorprozessRegelwerk.Infrastructure/"]

RUN dotnet restore "VorprozessRegelwerk.API/VorprozessRegelwerk.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/VorprozessRegelwerk.API"
RUN dotnet build "VorprozessRegelwerk.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "VorprozessRegelwerk.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8001
ENTRYPOINT ["dotnet", "VorprozessRegelwerk.API.dll"]