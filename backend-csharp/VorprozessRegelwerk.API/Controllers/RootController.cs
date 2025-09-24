using Microsoft.AspNetCore.Mvc;

namespace VorprozessRegelwerk.API.Controllers;

[ApiController]
[Route("api")]
public class RootController : ControllerBase
{
    [HttpGet]
    public IActionResult GetRoot()
    {
        return Ok(new 
        { 
            message = "Vorprozess Regelwerk API v1.0 with C# ASP.NET Core", 
            status = "running" 
        });
    }
}