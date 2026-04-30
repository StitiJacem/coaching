import 'package:flutter/material.dart';

enum AnimateInTransitionType { fade, slideUp, slideDown, slideLeft, slideRight }

class AnimateIn extends StatefulWidget {
  final Widget child;
  final int delay;
  final Duration duration;
  final AnimateInTransitionType transitionType;

  const AnimateIn({
    super.key,
    required this.child,
    this.delay = 0,
    this.duration = const Duration(milliseconds: 600),
    this.transitionType = AnimateInTransitionType.slideUp,
  });

  @override
  State<AnimateIn> createState() => _AnimateInState();
}

class _AnimateInState extends State<AnimateIn> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    
    Offset beginOffset;
    switch (widget.transitionType) {
      case AnimateInTransitionType.slideUp:
        beginOffset = const Offset(0, 0.1);
        break;
      case AnimateInTransitionType.slideDown:
        beginOffset = const Offset(0, -0.1);
        break;
      case AnimateInTransitionType.slideLeft:
        beginOffset = const Offset(0.1, 0);
        break;
      case AnimateInTransitionType.slideRight:
        beginOffset = const Offset(-0.1, 0);
        break;
      case AnimateInTransitionType.fade:
        beginOffset = Offset.zero;
        break;
    }

    _slide = Tween<Offset>(
      begin: beginOffset,
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}
