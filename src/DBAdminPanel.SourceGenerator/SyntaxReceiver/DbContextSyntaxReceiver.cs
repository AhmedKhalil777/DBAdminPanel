using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Collections.Generic;

namespace DBAdminPanel.SourceGenerator
{
    internal class DbContextSyntaxReceiver : ISyntaxReceiver
    {
        public List<ClassDeclarationSyntax> DbContextCandidates { get; } = new();

        public void OnVisitSyntaxNode(SyntaxNode syntaxNode)
        {
            if (syntaxNode is ClassDeclarationSyntax classDeclaration)
            {
                DbContextCandidates.Add(classDeclaration);
            }
        }
    }
}


